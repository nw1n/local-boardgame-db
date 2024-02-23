import { PrismaClient } from '@prisma/client'
import { prettyPrintJson } from 'pretty-print-json'
import db from '../lib/db.js'
import { IS_DEV_MODE, IS_DEV_TRUNCATE_DATA_MODE } from '../lib/config.js'
import _ from 'lodash'

export const getAllOwnerships = async () => {
    const games = await db.game.findMany({
        select: {
            full_name: true,
            rank: true,
            id: true,
            collectionItems: {
                select: {
                    username: true,
                    own: true,
                },
                where: {
                    own: true,
                },
                orderBy: {
                    username: 'asc',
                },
            },
            _count: {
                select: {
                    collectionItems: {
                        where: {
                            own: true,
                        },
                    },
                },
            },
        },
        where: {
            rank: {
                not: 0,
            },
            collectionItems: {
                some: {
                    own: true,
                },
            },
        },
        orderBy: {
            rank: 'asc',
        },
    })
    //res.send('<pre>' + JSON.stringify(games, null, 2) + '</pre>')

    // sort array of object by ['_count]['collectionItems']
    games.sort((a, b) => {
        if (a._count.collectionItems < b._count.collectionItems) {
            return 1
        }
        if (a._count.collectionItems > b._count.collectionItems) {
            return -1
        }
        return 0
    })

    if (IS_DEV_TRUNCATE_DATA_MODE) {
        // truncate array to top 100
        return _.take(games, 100)
    }

    return games
}
