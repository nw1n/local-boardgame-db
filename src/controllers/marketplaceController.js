import express from 'express'
import db from '../lib/db.js'
import { getDateOfLastCollectionItemFetch } from '../lib/dbApi.js'
import { IS_DEV_MODE, IS_DEV_TRUNCATE_DATA_MODE } from '../lib/config.js'
import _ from 'lodash'

export const getMarketplaceView = async () => {
    //const games = await db.game.findMany()
    const gamesSupply = await db.game.findMany({
        select: {
            full_name: true,
            rank: true,
            id: true,
            collectionItems: {
                select: {
                    username: true,
                    for_trade: true,
                    for_sale: true,
                },
                where: {
                    OR: [
                        {
                            for_trade: true,
                        },
                        {
                            for_sale: true,
                        },
                    ],
                },
                orderBy: {
                    username: 'asc',
                },
            },
            _count: {
                select: {
                    collectionItems: {
                        where: {
                            OR: [
                                {
                                    for_trade: true,
                                },
                                {
                                    for_sale: true,
                                },
                            ],
                        },
                    },
                },
            },
        },
        where: {
            collectionItems: {
                some: {
                    OR: [
                        {
                            for_trade: true,
                        },
                        {
                            for_sale: true,
                        },
                    ],
                },
            },
        },
        orderBy: {
            collectionItems: {
                _count: 'desc',
            },
        },
    })

    const gamesDemand = await db.game.findMany({
        select: {
            full_name: true,
            rank: true,
            id: true,
            collectionItems: {
                select: {
                    username: true,
                    want: true,
                    want_to_buy: true,
                    wishlist: true,
                },
                where: {
                    OR: [
                        {
                            want: true,
                        },
                        {
                            want_to_buy: true,
                        },
                        {
                            wishlist: true,
                        },
                    ],
                },
                orderBy: {
                    username: 'asc',
                },
            },
            _count: {
                select: {
                    collectionItems: {
                        where: {
                            OR: [
                                {
                                    want: true,
                                },
                                {
                                    want_to_buy: true,
                                },
                                {
                                    wishlist: true,
                                },
                            ],
                        },
                    },
                },
            },
        },
        where: {
            collectionItems: {
                some: {
                    OR: [
                        {
                            want: true,
                        },
                        {
                            want_to_buy: true,
                        },
                        {
                            wishlist: true,
                        },
                    ],
                },
            },
        },
        orderBy: {
            collectionItems: {
                _count: 'desc',
            },
        },
    })

    const gamesMatches = {}
    for (const game of gamesSupply) {
        gamesMatches[game.id] = {
            supply: game,
            demand: null,
        }
    }
    for (const game of gamesDemand) {
        if (gamesMatches[game.id]) {
            gamesMatches[game.id].demand = game
        } else {
            gamesMatches[game.id] = {
                supply: null,
                demand: game,
            }
        }
    }
    const gamesMatchesArray = []
    for (const gameId of Object.keys(gamesMatches)) {
        if (!gamesMatches[gameId].supply || !gamesMatches[gameId].demand) {
            continue
        }
        if (
            gamesMatches[gameId].supply._count.collectionItems > 0 &&
            gamesMatches[gameId].demand._count.collectionItems > 0
        ) {
            gamesMatchesArray.push(gamesMatches[gameId])
        }
    }

    // sort gamesMatchesArray by ['demand']['_count']['collectionItems']
    gamesMatchesArray.sort((a, b) => {
        if (a.supply._count.collectionItems < b.supply._count.collectionItems) {
            return 1
        }
        if (a.supply._count.collectionItems > b.supply._count.collectionItems) {
            return -1
        }
        return 0
    })

    // sort gameSupply by ['_count']['collectionItems']
    gamesSupply.sort((a, b) => {
        if (a._count.collectionItems < b._count.collectionItems) {
            return 1
        }
        if (a._count.collectionItems > b._count.collectionItems) {
            return -1
        }
        return 0
    })

    // sort gameDemand by ['_count']['collectionItems']
    gamesDemand.sort((a, b) => {
        if (a._count.collectionItems < b._count.collectionItems) {
            return 1
        }
        if (a._count.collectionItems > b._count.collectionItems) {
            return -1
        }
        return 0
    })

    // console.log(gamesMatchesArray)
    const matchStrings = []

    for (const match of gamesMatchesArray) {
        for (const supplier of match.supply.collectionItems) {
            for (const demander of match.demand.collectionItems) {
                if (supplier.username === demander.username) {
                    continue
                }
                //let matchString = 'SUPPLIER___'
                //matchString += supplier.username
                //matchString += '___DEMANDER___'
                //matchString += demander.username
                //matchString += '___ID___'
                //matchString += match.supply.id
                let matchString = ''
                matchString += supplier.username
                matchString += '___'
                matchString += demander.username
                matchString += '___'
                matchString += match.supply.id

                matchStrings.push(matchString)
            }
        }
    }
    //console.log(matchStrings)

    const possibleTradesObj = {}

    for (const matchString of matchStrings) {
        const matchStringSplit = matchString.split('___')
        const supplier = matchStringSplit[0]
        const demander = matchStringSplit[1]
        const gameId = matchStringSplit[2]

        if (supplier === demander) {
            continue
        }

        // find strings where supplier and demander are reversed
        const matchStringReversed = demander + '___' + supplier
        // const matchStringReversed = supplier + '___' + demander

        const result = {
            supplier: supplier,
            demander: demander,
            matchStrings: [],
        }

        for (const item of matchStrings) {
            // if (item.includes(matchStringReversed)) {
            //     result.matchStrings.push(matchString)
            //     result.matchStrings.push(item)
            // }
            if (item.includes(matchStringReversed)) {
                result.matchStrings.push(matchString)
                result.matchStrings.push(item)
            }
        }
        if (result.matchStrings.length === 0) {
            continue
        }
        if (!possibleTradesObj[supplier]) {
            possibleTradesObj[supplier] = []
        }
        possibleTradesObj[supplier].push(result)
    }

    // make all matchStrings unique
    for (const supplier of Object.keys(possibleTradesObj)) {
        const uniqueMatchStrings = []
        for (const result of possibleTradesObj[supplier]) {
            for (const matchString of result.matchStrings) {
                if (!uniqueMatchStrings.includes(matchString)) {
                    uniqueMatchStrings.push(matchString)
                }
            }
        }
        possibleTradesObj[supplier] = uniqueMatchStrings
    }

    const tradesSorted = {}
    for (const userName of Object.keys(possibleTradesObj)) {
        tradesSorted[userName] = {}
        for (const matchString of possibleTradesObj[userName]) {
            const matchStringSplit = matchString.split('___')
            const firstUser = matchStringSplit[0]
            const secondUser = matchStringSplit[1]
            const gameId = matchStringSplit[2]

            const otherUser = firstUser === userName ? secondUser : firstUser
            if (!tradesSorted[userName][otherUser]) {
                tradesSorted[userName][otherUser] = []
            }
            tradesSorted[userName][otherUser].push(matchString)
        }
    }

    const finalTrades = {}

    for (const userName of Object.keys(tradesSorted)) {
        finalTrades[userName] = {}
        for (const otherUser of Object.keys(tradesSorted[userName])) {
            finalTrades[userName][otherUser] = {}
            finalTrades[userName][otherUser][userName + '-gives'] = []
            finalTrades[userName][otherUser][otherUser + '-gives'] = []
            for (const matchString of tradesSorted[userName][otherUser]) {
                const matchStringSplit = matchString.split('___')
                const firstUser = matchStringSplit[0]
                const secondUser = matchStringSplit[1]
                const gameId = matchStringSplit[2]

                const otherUser = firstUser === userName ? secondUser : firstUser
                if (userName === otherUser) {
                    continue
                }

                if (firstUser === userName) {
                    finalTrades[userName][otherUser][userName + '-gives'].push(gameId)
                } else {
                    finalTrades[userName][otherUser][otherUser + '-gives'].push(gameId)
                }
            }
        }
    }

    const gameData = await db.game.findMany({
        select: {
            id: true,
            full_name: true,
        },
    })

    // in final games array, replace gameId with object that contains gameId and full_name
    for (const userName of Object.keys(finalTrades)) {
        for (const otherUser of Object.keys(finalTrades[userName])) {
            for (const user of Object.keys(finalTrades[userName][otherUser])) {
                const games = finalTrades[userName][otherUser][user]
                const gamesWithNames = []
                for (const gameId of games) {
                    const game = gameData.find((game) => game.id === parseInt(gameId))
                    gamesWithNames.push(game)
                }
                finalTrades[userName][otherUser][user] = gamesWithNames
            }
        }
    }

    // remove duplicate trades
    const finalTradesNoDuplicates = {}
    const listOfUserNames = new Set()
    for (const userName of Object.keys(finalTrades)) {
        finalTradesNoDuplicates[userName] = {}
        for (const otherUser of Object.keys(finalTrades[userName])) {
            if (listOfUserNames.has(otherUser)) {
                continue
            }
            finalTradesNoDuplicates[userName][otherUser] = finalTrades[userName][otherUser]
        }
        listOfUserNames.add(userName)
    }

    const usernamesListForPossibleTrades = new Set()
    for (const userName of Object.keys(finalTradesNoDuplicates)) {
        usernamesListForPossibleTrades.add(userName)
        for (const otherUser of Object.keys(finalTradesNoDuplicates[userName])) {
            usernamesListForPossibleTrades.add(otherUser)
        }
    }

    // console.log(JSON.stringify(possibleTradesObj, null, 2))
    // console.log('possibleTradesObj length: ' + Object.keys(possibleTradesObj).length)
    // console.log(tradesSorted)
    // console.log(JSON.stringify(finalTrades, null, 2))
    // console.log(usernamesListForPossibleTrades)

    // const trades = getTrades(gamesMatchesArray)

    //res.send('<pre>' + JSON.stringify(gamesMatchesArray, null, 2) + '</pre>')
    const result = {
        supply: gamesSupply,
        demand: gamesDemand,
        matches: gamesMatchesArray,
        trades: finalTradesNoDuplicates,
        usernamesListForPossibleTrades: usernamesListForPossibleTrades,
    }

    if (IS_DEV_TRUNCATE_DATA_MODE) {
        // truncate array to top 100
        result.supply = _.take(result.supply, 100)
        result.demand = _.take(result.demand, 100)
        result.matches = _.take(result.matches, 100)
    }
    return result
}

function getTrades(supplySrc, demandSrc) {
    // Sample data
    const games = [
        { name: 'Game1', suppliers: ['Supplier1', 'Supplier2'], demanders: ['Demander1', 'Demander2'] },
        { name: 'Game2', suppliers: ['Supplier2', 'Supplier3'], demanders: ['Demander2', 'Demander3'] },
        // Add more game entries
    ]

    // Find matches between suppliers and demanders
    const matches = []

    games.forEach((game) => {
        const commonSuppliers = game.suppliers.filter((supplier) => game.demanders.includes(supplier))
        if (commonSuppliers.length > 0) {
            matches.push({ game: game.name, suppliers: commonSuppliers })
        }
    })

    // Find potential trades
    const trades = []

    games.forEach((game) => {
        game.suppliers.forEach((supplier) => {
            const tradeCandidates = games.filter((otherGame) => {
                return otherGame.demanders.includes(supplier) && otherGame.suppliers.includes(game.name)
            })

            if (tradeCandidates.length > 0) {
                trades.push({ supplier, trades: tradeCandidates.map((tradeGame) => tradeGame.name) })
            }
        })
    })

    console.log('Matches:', matches)
    console.log('Potential Trades:', trades)

    return trades
}
