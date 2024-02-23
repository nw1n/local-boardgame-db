import db from '../lib/db.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    vacuumDatabase()
}

export async function vacuumDatabase() {
    
    try {
        // Run the VACUUM command
        await db.$executeRaw`PRAGMA foreign_keys=off;`
        await db.$executeRaw`VACUUM;`
        await db.$executeRaw`PRAGMA foreign_keys=on;`

        log('SQLite database vacuumed successfully')
    } catch (error) {
        log('Error vacuuming SQLite database:', error)
    } finally {
        await db.$disconnect()
    }
}
