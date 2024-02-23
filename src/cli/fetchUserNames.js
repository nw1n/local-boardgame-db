import { PrismaClient } from '@prisma/client'
import axios, { all } from 'axios'
import * as cheerio from 'cheerio'
import { sleep } from '../lib/util.js'
import db from '../lib/db.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'
import { CITY, COUNTRY, IS_DEV_TINY_FETCH_MODE } from '../lib/config.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export async function main() {
    await db.bggUserListItem.deleteMany()
    // await db.collectionItem.deleteMany()
    // await db.game.deleteMany()
    // await db.user.deleteMany()
    if (IS_DEV_TINY_FETCH_MODE) {
        await addDummyTestUsersToDb()
        return
    }
    await addStaticUserNamesToDb()
    await fetchUsernamesToDb()
}

async function addDummyTestUsersToDb() {
    const dummyUsersList = ['testuser1', 'testuser2']
    for (const username of dummyUsersList) {
        const isUserBlacklisted = await isNameInBlackList(username)
        if (isUserBlacklisted) {
            log('Skipping blacklisted user ' + username)
            continue
        } else {
            log('User not blacklisted: ' + username)
        }
        const data = {
            username: username,
            country: COUNTRY,
            city: CITY,
        }
        log('Upserting user ' + username)
        const user = await db.bggUserListItem.upsert({
            where: { username: username },
            create: data,
            update: {},
        })
    }
}

async function fetchUsernamesToDb() {
    let pageNr = 1
    let timesFailed = 0
    let success = false
    while (true) {
        log('Fetching page ' + pageNr)
        await sleep(1)
        success = await tryFetchingUsersPageToDb(pageNr)
        if (success) {
            log('Successfully fetched page ' + pageNr)
            pageNr++
            timesFailed = 0
            continue
        }
        timesFailed++
        log('Failed to fetch page ' + pageNr + ' ' + timesFailed + ' times')
        if (timesFailed > 5) {
            log('Failed too many times, stopping.')
            break
        }
    }
}
async function tryFetchingUsersPageToDb(pageNr = 1) {
    const url = `https://boardgamegeek.com/users/page/${pageNr}?country=${COUNTRY}&state=&city=${CITY}`
    log(`Fetching ${url}`)
    const response = await axios.get(url)
    if (response.status !== 200) {
        log('Error occurred while fetching!')
        return false
    }
    const html = response.data
    const $ = cheerio.load(html)
    const $users = $('.forum_table tbody td .username a')
    const usersList = $users.map((i, el) => $(el).text()).get()

    if (!usersList || usersList.length === 0) {
        return false
    }

    for (const username of usersList) {
        const isUserBlacklisted = await isNameInBlackList(username)
        if (isUserBlacklisted) {
            log('Skipping blacklisted user ' + username)
            continue
        } else {
            log('User not blacklisted: ' + username + '. Adding to db.')
        }
        const data = {
            username: username,
            country: COUNTRY,
            city: CITY,
        }
        log('Upserting user ' + username)
        const user = await db.bggUserListItem.upsert({
            where: { username: username },
            create: data,
            update: {},
        })
        // log(user)
    }
    return true
}

async function addStaticUserNamesToDb() {
    const usersList = [] // here you can add static usernames

    const uniqueUsersList = [...new Set(usersList)]
    for (const username of uniqueUsersList) {
        const isUserBlacklisted = await isNameInBlackList(username)
        if (isUserBlacklisted) {
            log('Skipping blacklisted user ' + username)
            continue
        } else {
            log('User not blacklisted: ' + username + '. Adding to db.')
        }
        const data = {
            username: username,
            country: COUNTRY,
            city: CITY,
        }
        log('Upserting user ' + username)
        const user = await db.bggUserListItem.upsert({
            where: { username: username },
            create: data,
            update: {},
        })
        // log(user)
    }
}

async function isNameInBlackList(name) {
    const blackListedNames = getBlackListedNames()
    if (blackListedNames.includes(name)) {
        return true
    }

    const user = await db.blackListedUserName.findUnique({
        where: { username: name },
    })

    if (user) {
        return true
    }

    return false
}

function getBlackListedNames() {
    return []
}
