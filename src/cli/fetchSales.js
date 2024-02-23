import db from '../lib/db.js'
import axios from 'axios'
import { initLogger, logger, log } from '../lib/scraperLogger.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export async function main() {
    const users = await db.tmpUser.findMany()
    // Fetch sales data for every user as JSON from BGG market
    for (const user of users) {
        if (user.has_collection === false) {
            log('user has no collection. skip. ' + user.username)
            continue
        }
        try {
            const username = user.username
            const url = `https://boardgamegeek.com/market/user/${username}?pageid=1`
            log('url: ' + url)

            // Get HTML page
            const response = await axios.get(url)

            if (response.status !== 200) {
                log('Error while fetching HTML data')
                continue
            }

            const htmlData = response.data

            // Search with regex in HTMLData string '&quot;userid&quot;:421132' and select the number
            // Get UserID
            const match = /any&quot;,&quot;userid&quot;:(\d+)/.exec(htmlData)
            let userId = 0
            if (match) {
                userId = match[1]
                log('userId: ' + userId)
            } else {
                log('No UserID found')
                continue
            }

            // Get JSON data
            // Sleep for 2 seconds to not overload the server
            await new Promise((resolve) => setTimeout(resolve, 2000))

            const jsonUrl =
                `https://api.geekdo.com/api/market/products?ajax=1&browsetype=browse&colluserid=0&condition=any` +
                `&country=any&currency=any&displaymode=gallery&findmywants=0&inventorytype=any&marketdomain=boardgame` +
                `&nosession=1&objectid=0&objecttype=thing&pageid=1&productstate=active&shiparea=any&sort=title&stock=instock&userid=${userId}`
            log('url: ' + jsonUrl)

            const jsonResponse = await axios.get(jsonUrl)

            if (jsonResponse.status !== 200) {
                log('Error while fetching JSON data')
                continue
            }

            const parsedJson = jsonResponse.data

            const products = parsedJson.products
            for (const product of products) {
                const gameId = product.objectlink.id
                const gameIdInt = parseInt(gameId, 10)
                log('gameId: ' + gameIdInt)

                const game = await db.tmpGame.findUnique({
                    where: { id: gameIdInt },
                })

                if (!game) {
                    log('No game found for gameId ' + gameIdInt + '. Skipping.')
                    continue
                }
                const addToDbRes = await db.tmpCollectionItem.upsert({
                    where: {
                        id_username: {
                            id: gameIdInt,
                            username: username,
                        },
                    },
                    create: {
                        username: username,
                        id: gameIdInt,
                        for_sale: true,
                        //game: {
                        //    connect: {
                        //        id: gameIdInt,
                        //    },
                        //},
                    },
                    update: {
                        for_sale: true,
                    },
                })
                log(addToDbRes)
            }

            log('Done adding forsale to local_market_items table for user ' + username)
        } catch (e) {
            log('Error while fetching data for user ' + user.username)
            log(e)
        }
        // Sleep for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000))
    }
}
