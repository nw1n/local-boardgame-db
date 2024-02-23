import fs from 'fs'
import path from 'path'
import { IS_DEV_TINY_FETCH_MODE, PORT } from '../lib/config.js'
import { initLogger, logger, log } from '../lib/scraperLogger.js'
import du from 'du'

const routesList = ['/', '/own', '/ratings', '/want-to-play', '/marketplace', '/fetch-reports']
const exportFolder = 'tmp/exported-routes/'
const distFolder = 'tmp/dist/'

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}

export async function main() {
    if (!fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder)
    }
    if (fs.existsSync(exportFolder)) {
        fs.rmSync(exportFolder, { recursive: true })
    }
    fs.mkdirSync(exportFolder)

    for (const routePath of routesList) {
        const url = 'http://localhost:' + PORT + routePath
        const response = await fetch(url)
        const html = await response.text()
        // write json file to folder exportFolder
        const routeName = routePath === '/' ? 'index' : routePath
        const filePath = exportFolder + routeName + '.html'
        fs.writeFileSync(filePath, html)
    }

    const sizeExportFolder = await du(exportFolder)
    const sizeDistFolder = await du(distFolder)
    log('Total size of all files in exportFolder: ' + (sizeExportFolder / 1024 / 1024).toFixed(2) + ' MB')
    log('Total size of all files in distFolder: ' + (sizeDistFolder / 1024 / 1024).toFixed(2) + ' MB')

    if (IS_DEV_TINY_FETCH_MODE) {
        log('dev_tiny_fetch_mode: skip checking if exportFolder is bigger than distFolder * 0.8.')
    } else {
        if (sizeExportFolder < sizeDistFolder * 0.8) {
            log('exportFolder is smaller than distFolder * 0.8. Aborting.')
            return
        }
    }

    log('exportFolder is bigger than distFolder * 0.8. Copying files from exportFolder to distFolder')
    // delete all files in distFolder
    fs.rmSync(distFolder, { recursive: true })
    fs.mkdirSync(distFolder)
    // copy all files from exportFolder to distFolder
    const files = fs.readdirSync(exportFolder)
    for (const file of files) {
        const filePath = path.join(exportFolder, file)
        const destinationPath = path.join(distFolder, file)
        fs.copyFileSync(filePath, destinationPath)
    }

    await moveAndRenameHTMLFilesInDistFolder()
    await copyStaticFilesToDistFolder()
}

async function copyStaticFilesToDistFolder() {
    const staticFolder = 'src/public'
    if (!fs.existsSync(staticFolder)) {
        log(`Static Folder ${staticFolder} does not exist`)
        return
    }
    const staticFiles = fs.readdirSync(staticFolder)

    for (const file of staticFiles) {
        const filePath = path.join(staticFolder, file)
        const destinationPath = path.join(distFolder, file)
        fs.copyFileSync(filePath, destinationPath)
    }
}

async function moveAndRenameHTMLFilesInDistFolder() {
    const inputDirectory = distFolder
    try {
        // Read the list of files in the specified directory
        const files = fs.readdirSync(inputDirectory)

        // Loop through each HTML file in the directory
        for (const file of files) {
            if (file.endsWith('.html')) {
                // Extract the file name (without extension)
                const filename = path.parse(file).name

                if (filename === 'index') {
                    continue
                }

                // Create a subfolder with the file name
                const subfolderPath = path.join(inputDirectory, filename)
                fs.mkdirSync(subfolderPath, { recursive: true })

                // Move the HTML file into the subfolder and rename it to index.html
                const destinationPath = path.join(subfolderPath, 'index.html')
                fs.renameSync(path.join(inputDirectory, file), destinationPath)

                log(`Moved ${file} to ${destinationPath}`)
            }
        }
    } catch (error) {
        log(`Error: ${error}`)
        console.error('Error:', error.message)
    }
}
