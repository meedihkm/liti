-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL DEFAULT '',
    "wilayaCode" INTEGER NOT NULL,
    "wilayaName" TEXT NOT NULL,
    "commune" TEXT NOT NULL DEFAULT '',
    "productType" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "referenceImages" TEXT NOT NULL DEFAULT '[]',
    "fabricPreference" TEXT NOT NULL DEFAULT '',
    "colorPreference" TEXT NOT NULL DEFAULT '',
    "measurementsJson" TEXT NOT NULL DEFAULT '{}',
    "budget" INTEGER NOT NULL DEFAULT 0,
    "deadline" TEXT NOT NULL DEFAULT '',
    "estimatedPrice" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "orderId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuoteMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderName" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteMessage_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "actor" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteStatusHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "wilayaCode" INTEGER NOT NULL DEFAULT 0,
    "wilayaName" TEXT NOT NULL DEFAULT '',
    "commune" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "measurementsJson" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_phone_key" ON "CustomerProfile"("phone");
