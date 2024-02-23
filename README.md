# Local Boardgame DB

Scrapes boardgamegeek.com for data of in your local city and stores in a sqlite db and serves it with a Node JS Express webserver.

Displayed data includes: what games people own, what trades are possible and how people rate the games of the selected region.

## How to use

Step 1: Install node modules

```bash
npm install
```

Step 2: Init Sqlite Database:

```bash
npm run prisma-migrate
```

Step 3: Start scraping Data (this can take hours, depending on the location you are scraping). On first time use this command needs to be successfully executed twice, after that a single execution of the command is enough to scrape the data again.

```bash
npm run scrape-full
```

Step 4: Start the server

```bash
npm run start
```

OR Step 4 alternative: Generate a static website with html files for all routes

```bash
npm run export-routes
```
