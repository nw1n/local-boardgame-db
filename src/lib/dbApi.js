import db from './db.js'

export async function getDateOfLastCollectionItemFetch() {
    // fetch from db a single collectionItem and retrieve date
    const singleCollectionItemWithDate = await db.collectionItem.findFirst({
        select: {
            date_added: true,
        },
    })
    const result = singleCollectionItemWithDate?.date_added
    return result || ''
}
