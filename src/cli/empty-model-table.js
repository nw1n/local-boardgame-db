import { PrismaClient } from '@prisma/client'
import { print, sleep } from '../lib/util.js'
import db from '../lib/db.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

async function main() {
    const arg = process.argv[2]
    const commandStart = '--model='

    if (arg.length < 3) {
        log('Invalid command. Please provide a prisma model.')
        process.exit(1)
    }

    if (!arg.startsWith(commandStart)) {
        log('Invalid command. Please provide a prisma model.')
        process.exit(1)
    }

    const tableName = arg.replace(commandStart, '')

    if (!tableName) {
        log('Invalid command. Please provide a prisma model.')
        process.exit(1)
    }

    log('emptying table for prisma model: ' + tableName)
    try {
        await db[tableName].deleteMany()
        log('success emptying table for prisma model: ' + tableName)
    } catch (e) {
        log('error emptying table for prisma model: ' + tableName)
        throw e
    }
}
