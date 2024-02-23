import express from 'express'
import db from '../lib/db.js'
import _ from 'lodash'
import { IS_DEV_MODE, IS_DEV_TRUNCATE_DATA_MODE } from '../lib/config.js'

export const getWantToPlayView = async () => {
    const games = await db.game.findMany({
        select: {
            full_name: true,
            rank: true,
            id: true,
            collectionItems: {
                select: {
                    username: true,
                    want_to_play: true,
                },
                where: {
                    want_to_play: true,
                },
                orderBy: {
                    username: 'asc',
                },
            },
            _count: {
                select: {
                    collectionItems: {
                        where: {
                            want_to_play: true,
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
                    want_to_play: true,
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
