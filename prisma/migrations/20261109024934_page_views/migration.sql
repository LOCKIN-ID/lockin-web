-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "referrerHost" TEXT,
    "country" TEXT,
    "visitorKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PageView_dayKey_idx" ON "PageView"("dayKey");

-- CreateIndex
CREATE INDEX "PageView_path_dayKey_idx" ON "PageView"("path", "dayKey");

-- CreateIndex
CREATE INDEX "PageView_visitorKey_dayKey_idx" ON "PageView"("visitorKey", "dayKey");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");
