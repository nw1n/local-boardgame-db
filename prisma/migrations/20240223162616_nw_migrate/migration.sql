-- CreateTable
CREATE TABLE "PageCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BggUserListItem" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "date_added" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "has_collection" BOOLEAN,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_collection_fetched" DATETIME
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL DEFAULT '',
    "rank" INTEGER NOT NULL DEFAULT 0,
    "owners_amount" INTEGER NOT NULL DEFAULT 0,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_rating" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "date_added" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" REAL NOT NULL DEFAULT 0,
    "own" BOOLEAN NOT NULL DEFAULT false,
    "prev_owned" BOOLEAN NOT NULL DEFAULT false,
    "for_trade" BOOLEAN NOT NULL DEFAULT false,
    "want" BOOLEAN NOT NULL DEFAULT false,
    "want_to_play" BOOLEAN NOT NULL DEFAULT false,
    "want_to_buy" BOOLEAN NOT NULL DEFAULT false,
    "wishlist" BOOLEAN NOT NULL DEFAULT false,
    "for_sale" BOOLEAN NOT NULL DEFAULT false,
    "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_plays" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("id", "username"),
    CONSTRAINT "CollectionItem_id_fkey" FOREIGN KEY ("id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CollectionItem_username_fkey" FOREIGN KEY ("username") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TmpUser" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "has_collection" BOOLEAN,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_collection_fetched" DATETIME
);

-- CreateTable
CREATE TABLE "TmpGame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "full_name" TEXT NOT NULL DEFAULT '',
    "rank" INTEGER NOT NULL DEFAULT 0,
    "owners_amount" INTEGER NOT NULL DEFAULT 0,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_rating" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "TmpCollectionItem" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "date_added" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_changed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" REAL NOT NULL DEFAULT 0,
    "own" BOOLEAN NOT NULL DEFAULT false,
    "prev_owned" BOOLEAN NOT NULL DEFAULT false,
    "for_trade" BOOLEAN NOT NULL DEFAULT false,
    "want" BOOLEAN NOT NULL DEFAULT false,
    "want_to_play" BOOLEAN NOT NULL DEFAULT false,
    "want_to_buy" BOOLEAN NOT NULL DEFAULT false,
    "wishlist" BOOLEAN NOT NULL DEFAULT false,
    "for_sale" BOOLEAN NOT NULL DEFAULT false,
    "last_modified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "num_plays" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("id", "username"),
    CONSTRAINT "TmpCollectionItem_id_fkey" FOREIGN KEY ("id") REFERENCES "TmpGame" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TmpCollectionItem_username_fkey" FOREIGN KEY ("username") REFERENCES "TmpUser" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FetchReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "percent_of_prev" INTEGER NOT NULL,
    "num_items" INTEGER NOT NULL,
    "num_users" INTEGER NOT NULL,
    "no_collection_users" TEXT NOT NULL,
    "num_no_collection_users" INTEGER NOT NULL,
    "num_games" INTEGER NOT NULL,
    "num_errors" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "BlackListedUserName" (
    "username" TEXT NOT NULL PRIMARY KEY,
    "date_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PageCache_url_key" ON "PageCache"("url");

-- CreateIndex
CREATE UNIQUE INDEX "BggUserListItem_username_key" ON "BggUserListItem"("username");
