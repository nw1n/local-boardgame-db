import express from 'express'
import { PrismaClient } from '@prisma/client'
import { prettyPrintJson } from 'pretty-print-json'
import db from '../lib/db.js'
import _ from 'lodash'

export const getAllFetchReportsView = async (req, res) => {
    // const reports = await db.fetchReport.findMany({
    //     orderBy: {
    //         date_created: 'desc',
    //     },
    //     take: 30,
    // })
    const reports = await db.fetchReport.findMany()
    return _.takeRight(reports, 30)
}
