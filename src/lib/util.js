import * as cheerio from 'cheerio'

export function print(...args) {
    console.log(...args)
}

export function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, 1000 * seconds))
}

export function parseCollectionXml(xml) {
    const $ = cheerio.load(xml, { xmlMode: true })
    const $items = $('item')
    const items = $items.map((i, el) => {
        const $el = $(el)
        const item = {
            id: $el.attr('objectid'),
            name: $el.find('name').text(),
            originalname: $el.find('originalname').text(),
            //image: $el.find('image').text(),
            //thumbnail: $el.find('thumbnail').text(),
            //yearpublished: $el.find('yearpublished').text(),
            //numplays: $el.find('numplays').text(),
            numowned: $el.find('stats').attr('numowned'),
            userRating: $el.find('rating').attr('value'),
            averageRating: $el.find('average').attr('value'),
            rank: $el.find('rank[name="boardgame"]').attr('value'),
            status: {
                own: $el.find('status').attr('own'),
                prevowned: $el.find('status').attr('prevowned'),
                fortrade: $el.find('status').attr('fortrade'),
                want: $el.find('status').attr('want'),
                wanttoplay: $el.find('status').attr('wanttoplay'),
                wanttobuy: $el.find('status').attr('wanttobuy'),
                wishlist: $el.find('status').attr('wishlist'),
                //    preordered: $el.find('status').attr('preordered'),
                //    lastmodified: $el.find('status').attr('lastmodified'),
            },
        }
        return item
    })
    return items.get()
}
