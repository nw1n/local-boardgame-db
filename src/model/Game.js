import { PrismaClient, Game as GameTypeDef } from '@prisma/client'

export default class Game {
    id
    full_name
    avg_rating
    owners_amount

    constructor(data) {
        this.id = data.id || 0
        this.full_name = data.full_name || ''
        this.avg_rating = data.avg_rating || 0
        this.owners_amount = data.owners_amount || 0
    }

    get bggUrl() {
        return Game.getBggUrl(this.id)
    }

    static getBggUrl(gameId, gameName = 'gamenamedefault') {
        const url = `https://boardgamegeek.com/boardgame/${gameId}/${gameName}`
        return url
    }
}
