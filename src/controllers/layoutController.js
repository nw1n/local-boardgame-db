import express from 'express'
import { PrismaClient } from '@prisma/client'
import { prettyPrintJson } from 'pretty-print-json'
import db from '../lib/db.js'
import _ from 'lodash'
import { getDateOfLastCollectionItemFetch } from '../lib/dbApi.js'
import { CITY, COUNTRY } from '../lib/config.js'

export const getLayoutData = async (req, res) => {
    const formatDate = (date) => {
        if (!date) {
            return 'unknown'
        }
        const dateObj = new Date(date)
        if (!dateObj) {
            return 'unknown'
        }

        return dateObj.toLocaleString('de-DE')
    }
    const dateLastFetchedRaw = await getDateOfLastCollectionItemFetch()
    const dateLastFetched = formatDate(dateLastFetchedRaw)
    return {
        dateLastFetched,
        city: CITY,
        country: COUNTRY,
    }
}
