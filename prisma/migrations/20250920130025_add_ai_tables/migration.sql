-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorName" TEXT NOT NULL,
    "summaryDate" DATETIME NOT NULL,
    "summaryText" TEXT NOT NULL,
    "repositoryUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hasAISummary" BOOLEAN NOT NULL DEFAULT false,
    "aiSummaryId" INTEGER,
    CONSTRAINT "DailySummary_aiSummaryId_fkey" FOREIGN KEY ("aiSummaryId") REFERENCES "AISummary" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AISummary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorName" TEXT NOT NULL,
    "summaryDate" DATETIME NOT NULL,
    "commitHashList" TEXT NOT NULL,
    "aiSummaryText" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIModelConfiguration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelIdentifier" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "temperature" REAL NOT NULL DEFAULT 0.3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "APIUsageTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelUsed" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "requestDuration" INTEGER NOT NULL,
    "requestStatus" TEXT NOT NULL,
    "errorMessage" TEXT,
    "authorName" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "DailySummary_authorName_summaryDate_idx" ON "DailySummary"("authorName", "summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_authorName_summaryDate_repositoryUrl_key" ON "DailySummary"("authorName", "summaryDate", "repositoryUrl");

-- CreateIndex
CREATE INDEX "AISummary_authorName_summaryDate_idx" ON "AISummary"("authorName", "summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "AISummary_authorName_summaryDate_key" ON "AISummary"("authorName", "summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "AIModelConfiguration_modelIdentifier_key" ON "AIModelConfiguration"("modelIdentifier");

-- CreateIndex
CREATE INDEX "AIModelConfiguration_isPrimary_idx" ON "AIModelConfiguration"("isPrimary");

-- CreateIndex
CREATE INDEX "APIUsageTracking_requestTimestamp_idx" ON "APIUsageTracking"("requestTimestamp");

-- CreateIndex
CREATE INDEX "APIUsageTracking_authorName_idx" ON "APIUsageTracking"("authorName");
