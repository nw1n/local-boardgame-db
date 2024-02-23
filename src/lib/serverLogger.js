import winston from 'winston'
import fs from 'fs'

const fileName = 'tmp/server.log'
let logger

const initLogger = () => {
    if (logger) {
        return
    }
    // delete fileName log file if it exists
    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName)
    }

    logger = winston.createLogger({
        format: winston.format.simple(),
        transports: [
            new winston.transports.Console({
                level: 'info',
            }),
            new winston.transports.File({
                filename: fileName,
                level: 'info',
            }),
        ],
    })
}

const log = (message) => {
    if (!logger) {
        initLogger()
    }
    // get date and time formatted for region gmt+1
    const date = new Date()
    date.setHours(date.getHours() + 1)
    const dataTimeFormatted = date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
    logger.log('info', dataTimeFormatted + ': ' + message)
}

export { log, initLogger, logger }
