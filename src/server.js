import express from 'express'
import path from 'path'
import cors from 'cors'
import 'dotenv/config'
import { PORT } from './lib/config.js'
import { getAllOwnerships } from './controllers/ownController.js'
import { getGamesRatings } from './controllers/ratingsController.js'
import { getWantToPlayView } from './controllers/wantToPlayController.js'
import { getMarketplaceView } from './controllers/marketplaceController.js'
import { getAllFetchReportsView } from './controllers/fetchReportsController.js'
import { initLogger, logger, log } from './lib/serverLogger.js'
import nunjucks from 'nunjucks'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { getLayoutData } from './controllers/layoutController.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isMainScript = import.meta.url === `file://${process.argv[1]}`

if (isMainScript) {
    main()
}

export async function main(tempServerCbFunc = null) {
    const app = express()
    app.use(cors())
    app.use(express.static(path.join(__dirname, 'public')))

    // Inint Nunjucks
    app.set('templates', __dirname + '/src/templates')
    nunjucks.configure('src/templates', {
        autoescape: true,
        express: app,
        noCache: true, // Disable caching for development
    })
    app.set('view engine', 'nunjucks')

    initLogger()

    app.get('/', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        res.render('home.njk', { title: 'Home', layoutData })
    })

    app.get('/own', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        const data = await getAllOwnerships()
        res.render('own.njk', { title: 'Owned Games', layoutData, data })
    })

    app.get('/ratings', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        const data = await getGamesRatings()
        res.render('ratings.njk', { title: 'Ratings', layoutData, data })
    })

    app.get('/want-to-play', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        const data = await getWantToPlayView()
        res.render('wanttoplay.njk', { title: 'Want to play', layoutData, data })
    })

    app.get('/marketplace', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        const data = await getMarketplaceView()
        res.render('marketplace.njk', { title: 'Marketplace', layoutData, data })
    })

    app.get('/fetch-reports', async (req, res) => {
        const layoutData = await getLayoutData(req, res)
        const data = await getAllFetchReportsView()
        res.render('fetch-reports.njk', { title: 'System: Fetch reports', layoutData, data })
    })

    const server = app.listen(PORT, () => {
        log(`Server is running on http://localhost:${PORT}`)
        if (tempServerCbFunc) {
            tempServerCbFunc(server)
        }
    })
}
