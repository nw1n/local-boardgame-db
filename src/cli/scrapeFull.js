import { vacuumDatabase } from './vacuumDb.js'
import { main as fetchUserNames } from './fetchUserNames.js'
import { main as fetchCollections } from './fetchCollections.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export async function main() {
    log('Start Scraping full')
    await vacuumDatabase()
    await fetchUserNames()
    await fetchCollections()
    log('Finished Scraping full')
}
