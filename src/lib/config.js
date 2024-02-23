import 'dotenv/config'

export const PORT = process.env.PORT || 5000
export const NODE_ENV = process.env.NODE_ENV || 'production'
export const IS_DEV_MODE = NODE_ENV === 'development'
export const IS_DISABLED_FETCH_SALES_MODE = process.env.IS_DISABLED_FETCH_SALES_MODE === '1' ? true : false
export const IS_DEV_TINY_FETCH_MODE = process.env.IS_DEV_TINY_FETCH_MODE === '1' ? true : false
export const IS_DEV_TRUNCATE_DATA_MODE = process.env.IS_DEV_TRUNCATE_DATA_MODE === '1' ? true : false
export const CITY = process.env.CITY || 'Hamburg'
export const COUNTRY = process.env.COUNTRY || 'Germany'
