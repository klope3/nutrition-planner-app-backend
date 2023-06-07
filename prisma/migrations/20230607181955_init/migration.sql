-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DayChart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "DayChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Day" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "indexInChart" INTEGER NOT NULL,
    "dayChartId" INTEGER NOT NULL,
    CONSTRAINT "Day_dayChartId_fkey" FOREIGN KEY ("dayChartId") REFERENCES "DayChart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DaySection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "indexInDay" INTEGER NOT NULL,
    "dayId" INTEGER NOT NULL,
    CONSTRAINT "DaySection_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fdcId" INTEGER NOT NULL,
    "daySectionId" INTEGER NOT NULL,
    CONSTRAINT "Portion_daySectionId_fkey" FOREIGN KEY ("daySectionId") REFERENCES "DaySection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DayChart_userId_key" ON "DayChart"("userId");
