import db from '../lib/db.js'
import axios from 'axios'
import { parseCollectionXml } from '../lib/util.js'
import { print, sleep } from '../lib/util.js'
import User from '../model/User.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'
import { main as fetchSales } from './fetchSales.js'
import { IS_DEV_TINY_FETCH_MODE, IS_DISABLED_FETCH_SALES_MODE } from '../lib/config.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export async function main() {
    await db.tmpCollectionItem.deleteMany()
    await db.tmpGame.deleteMany()
    await db.tmpUser.deleteMany()

    await createUsersFromUserList()
    const allUserNames = await db.bggUserListItem.findMany()

    let i = 0

    const report = {
        status: 'ok',
        message: '',
        percent_of_prev: 0,
        num_items: 0,
        num_users: 0,
        no_collection_users: '',
        num_no_collection_users: 0,
        num_games: 0,
        num_errors: 0,
    }

    for (const bggUserListItem of allUserNames) {
        const user = await db.tmpUser.findUnique({
            where: { username: bggUserListItem.username },
        })
        i++
        log('Fetching collection of user ' + i + '/' + allUserNames.length + ': ' + bggUserListItem.username)
        if (!user) {
            log('Eror. User not found in db: ' + bggUserListItem.username)
            continue
        }
        if (user.date_collection_fetched) {
            log('users collection already fetched. skip. ' + user.username)
            continue
        }
        if (user.has_collection === false) {
            log('user has no collection. skip. ' + user.username)
            continue
        }
        await fetchCollectionItemsOfUserAndStoreToDbIncGames(user, report)
    }

    // fetch sales data
    if (!IS_DISABLED_FETCH_SALES_MODE) {
        log('IS_DISABLED_FETCH_SALES_MODE is not active. Fetching sales data')
        await fetchSales()
    } else {
        log('IS_DISABLED_FETCH_SALES_MODE is active. Skipping fetching sales data')
    }

    // here we might check if data is correct and then copy it to real tables
    const amountOfCollectionItemsInTmp = await db.tmpCollectionItem.count()
    const amountOfCollectionItemsInReal = await db.collectionItem.count()

    report.num_items = amountOfCollectionItemsInTmp

    if (amountOfCollectionItemsInReal === 0) {
        report.percent_of_prev = 100
    } else {
        report.percent_of_prev = (amountOfCollectionItemsInTmp / amountOfCollectionItemsInReal) * 100
        report.percent_of_prev = parseInt(report.percent_of_prev, 10)
    }

    // write report to db
    log('Writing report to db. ' + JSON.stringify(report))
    try {
        await db.fetchReport.create({
            data: report,
        })
    } catch (e) {
        log('Error while writing report to db: ' + e)
    }

    // check if tmp data is at least 80% of real data
    const isTmpDataCorrect = amountOfCollectionItemsInTmp >= amountOfCollectionItemsInReal * 0.9
    if (IS_DEV_TINY_FETCH_MODE) {
        log('dev_tiny_fetch_mode: skip checking if tmp data is at least 90% of real data.')
    } else {
        if (!isTmpDataCorrect) {
            log('Error. Amount of collection items in tmp is less than 90% of real')
            return
        }
    }
    log('Tmp Data seems correct. Copying tmp data to real tables')
    await copyTmpDataToRealTables()
}

async function copyTmpDataToRealTables() {
    await db.collectionItem.deleteMany()
    await db.game.deleteMany()
    await db.user.deleteMany()
    await db.$queryRaw`INSERT INTO Game SELECT * FROM TmpGame`
    await db.$queryRaw`INSERT INTO User SELECT * FROM TmpUser`
    await db.$queryRaw`INSERT INTO CollectionItem SELECT * FROM TmpCollectionItem`
}

async function createUsersFromUserList() {
    const bggListUserItems = await db.bggUserListItem.findMany()

    for (const listItem of bggListUserItems) {
        const res = await db.tmpUser.upsert({
            where: { username: listItem.username },
            update: {},
            create: {
                username: listItem.username,
                country: listItem.country,
                city: listItem.city,
            },
        })
    }
}

async function fetchCollectionItemsOfUserAndStoreToDbIncGames(user, report) {
    const url = User.getBggCollectionUrl(user.username)
    let xml = null
    let xmlData = null
    for (let i = 0; i < 24; i++) {
        try {
            log('Fetching: ' + url)
            xml = await axios.get(url)
            xmlData = xml ? xml['data'] : null
            if (xmlData) {
                if (xmlData.includes('totalitems="') && !xmlData.includes('totalitems="0"')) {
                    break
                }
            }
        } catch (e) {
            log('Error occurred while fetching: ' + url + '. times failed: ' + (i + 1))
        }
        log(`Could not fetch user collection: ${user.username}. Sleeping 4s and retry. times failed: ${i + 1}`)
        if (i < 4) {
            await sleep(5)
        } else {
            log('Failed more than 4 times. Sleeping 15s')
            await sleep(15)
        }
    }
    if (!xmlData) {
        log('Error occurred while fetching!')
        log('Setting has_collection to FALSE')
        await db.tmpUser.update({
            where: { username: user.username },
            data: { has_collection: false },
        })
        report.num_errors++
        report.no_collection_users += user.username + ', '
        report.num_no_collection_users++
        log('Adding user to blacklist: ' + user.username)
        await db.blackListedUserName.upsert({
            where: { username: user.username },
            update: {},
            create: {
                username: user.username,
            },
        })
        return false
    }
    const data = parseCollectionXml(xmlData)
    if (!data || data.length === 0) {
        log('User collection is empty')
        await db.tmpUser.update({
            where: { username: user.username },
            data: { has_collection: false },
        })
        report.no_collection_users += user.username + ', '
        report.num_no_collection_users++
        log('Adding user to blacklist: ' + user.username)
        await db.blackListedUserName.upsert({
            where: { username: user.username },
            update: {},
            create: {
                username: user.username,
            },
        })
        return false
    }
    let isSucess = await storeGamesToDb(data)

    if (!isSucess) {
        log('Error occurred while storing games')
        report.num_errors++
        return false
    }

    isSucess = await storeCollectionItemsToDb(user, data)

    if (!isSucess) {
        log('Error occurred while storing collection items')
        report.num_errors++
        return false
    }

    await db.tmpUser.update({
        where: { username: user.username },
        data: {
            date_collection_fetched: new Date(),
            has_collection: true,
        },
    })
    return isSucess
}

async function storeGamesToDb(data) {
    if (!data) {
        log('No data to store')
        return false
    }

    const allGameIds = await db.tmpGame.findMany({
        select: { id: true },
    })
    const allGameIdsSet = new Set()
    for (const game of allGameIds) {
        allGameIdsSet.add(game.id)
    }

    for (const game of data) {
        const gameId = parseInt(game.id)

        if (!gameId) {
            log('gameId missing. skipping.')
            continue
        }
        if (allGameIdsSet.has(gameId)) {
            log('game already in db, skipping: ' + gameId)
            continue
        }

        let rank = 0
        if (game.rank) {
            rank = parseInt(game.rank)
            if (!rank) {
                rank = 0
            }
        }
        const itemName = game.originalname ? game.originalname : game.name
        log('storing game to db: ' + game.name)
        const gameNew = {
            id: gameId,
            full_name: itemName,
            rank: rank,
            owners_amount: parseInt(game.numowned) ?? 0,
            avg_rating: parseFloat(game.averageRating) ?? 0,
        }
        await db.tmpGame.create({
            data: gameNew,
        })

        allGameIdsSet.add(gameId)
    }
    return true
}

async function storeCollectionItemsToDb(user, data) {
    log('Storing collection items to db')
    if (!data || data.length === 0) {
        log('No data to store')
        return false
    }
    for (const item of data) {
        const gameId = item.id ? parseInt(item.id) : 0
        if (!gameId) {
            log('gameId missing. skipping.')
            continue
        }
        const itemName = item.originalname ? item.originalname : item.name
        const createDataItem = {
            id: gameId,
            username: user.username,
            rating: parseFloat(item.userRating) || 0,
            own: !!parseInt(item.status.own),
            want: !!parseInt(item.status.want),
            want_to_play: !!parseInt(item.status.wanttoplay),
            want_to_buy: !!parseInt(item.status.wanttobuy),
            for_trade: !!parseInt(item.status.fortrade),
            prev_owned: !!parseInt(item.status.prevowned),
            wishlist: !!parseInt(item.status.wishlist),
        }
        // if game is in collection in multiple copies, then use positive values for update (own etc.)
        const updateDataItem = {}
        for (const key of Object.keys(createDataItem)) {
            if (createDataItem[key]) {
                updateDataItem[key] = createDataItem[key]
            }
        }
        log('storing collection item to db: ' + itemName)
        const res = await db.tmpCollectionItem.upsert({
            where: {
                id_username: {
                    id: createDataItem.id,
                    username: createDataItem.username,
                },
            },
            update: updateDataItem,
            create: createDataItem,
        })
    }
    return true
}
