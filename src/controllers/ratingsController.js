import express from 'express'
import { PrismaClient } from '@prisma/client'
import { prettyPrintJson } from 'pretty-print-json'
import db from '../lib/db.js'
import _ from 'lodash'
import { IS_DEV_MODE, IS_DEV_TRUNCATE_DATA_MODE } from '../lib/config.js'

export const getGamesRatings = async () => {
    // fetch games and get _avg and _count for connected collectionItems ratings
    const games = await db.game.findMany({
        select: {
            full_name: true,
            rank: true,
            id: true,
            avg_rating: true,
            collectionItems: {
                select: {
                    rating: true,
                    username: true,
                },
                where: {
                    rating: {
                        gt: 0,
                    },
                },
                orderBy: {
                    rating: 'desc',
                },
            },
            _count: {
                select: {
                    collectionItems: {
                        where: {
                            rating: {
                                gt: 0,
                            },
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
                    rating: {
                        gt: 0,
                    },
                },
            },
        },
        orderBy: {
            rank: 'asc',
        },
    })

    const gameWithMinimalCount = games.filter((game) => game._count.collectionItems > 2)

    const gamesWithAvgRating = gameWithMinimalCount.map((game) => {
        const ratings = game.collectionItems.map((item) => item.rating)
        const avgRating = ratings.reduce((a, b) => a + b) / ratings.length
        const avgRatingRounded = Math.round(avgRating * 10) / 10
        const bggAvgRatingRounded = Math.round(game.avg_rating * 10) / 10
        const ratingDiffBase = avgRatingRounded - bggAvgRatingRounded
        const ratingDiff = Math.round(ratingDiffBase * 10) / 10
        // add plus sign if positive
        return {
            ...game,
            local_avg_rating: avgRatingRounded,
            rating_diff: ratingDiff,
        }
    })

    const gamesWithAvgRatingSorted = gamesWithAvgRating.sort((a, b) => b.local_avg_rating - a.local_avg_rating)

    if (IS_DEV_TRUNCATE_DATA_MODE) {
        // truncate array to top 100
        return _.take(gamesWithAvgRatingSorted, 100)
    }
    return gamesWithAvgRatingSorted
    //res.send('<pre>' + JSON.stringify(gamesWithAvgRating, null, 2) + '</pre>')
}
