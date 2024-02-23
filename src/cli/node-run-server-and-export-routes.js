import { spawn } from 'child_process'
import { print, sleep } from '../lib/util.js'
import { main as exportRoutes } from './exportRoutes.js'
import { main as startServer } from '../server.js'
import { main as scrapeFull } from './scrapeFull.js'
import { PORT } from '../lib/config.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'

if (import.meta.url === `file://${process.argv[1]}`) {
    let isScrapeMode = true
    if (process.argv[2] === '--no-scrape') {
        isScrapeMode = false
    }
    main(isScrapeMode)
}

async function main(isScrapeMode = true) {
    console.log('starting server')
    if (isScrapeMode) {
        console.log('scraping data')
        await scrapeFull()
    } else {
        console.log('skipping scraping')
    }
    await startServer(tempServerCbFunc)
}

async function tempServerCbFunc(server) {
    await sleep(1)
    log('Fetching Data')
    const response = await fetch(`http://localhost:${PORT}`)
    const html = await response.text()
    log('Exporting Routes')
    await exportRoutes()
    log('Stopping Server')
    server.close()
}
