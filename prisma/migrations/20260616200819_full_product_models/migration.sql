-- CreateEnum
CREATE TYPE "ContactVisibility" AS ENUM ('VERIFIED_ONLY', 'ALL');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'PENDING', 'SOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('SPECIFIC', 'FREE', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "ItemDealStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpectedTime" AS ENUM ('ASAP', 'THIS_WEEK', 'TWO_WEEKS', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NeedMatchStatus" AS ENUM ('APPLIED', 'MATCHED', 'CANCELLING', 'COMPLETED', 'CANCELLED', 'NOT_SELECTED');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('ITEM', 'BOOKING', 'NEED_MATCH');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('ITEM', 'SERVICE', 'NEED', 'USER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FALSE_INFO', 'SUSPECTED_FRAUD', 'INAPPROPRIATE', 'INVALID_CONTACT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReportAction" AS ENUM ('NONE', 'WARNING', 'TAKEDOWN', 'BAN');

-- CreateEnum
CREATE TYPE "ViolationSource" AS ENUM ('MANUAL', 'BOOKING_CANCEL', 'MATCH_CANCEL');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB;

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "priceMode" "PriceMode" NOT NULL DEFAULT 'SPECIFIC',
    "price" INTEGER,
    "originalPrice" INTEGER,
    "imageKeys" TEXT[],
    "tags" TEXT[],
    "tradeMethods" TEXT[],
    "pickupLocation" TEXT,
    "contactInfo" TEXT NOT NULL,
    "contactVisibility" "ContactVisibility" NOT NULL DEFAULT 'VERIFIED_ONLY',
    "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemInterest" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemDeal" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "ItemDealStatus" NOT NULL DEFAULT 'PENDING',
    "firstConfirmerId" TEXT,
    "firstConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "proofImageKeys" TEXT[],
    "categories" TEXT[],
    "formats" TEXT[],
    "durationTier" TEXT,
    "price" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "contactVisibility" "ContactVisibility" NOT NULL DEFAULT 'VERIFIED_ONLY',
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSlot" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "slotId" TEXT,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "slotEnd" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "firstConfirmerId" TEXT,
    "firstConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "liabilityAgreed" BOOLEAN,
    "liabilityDecidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Need" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedProfile" TEXT,
    "reward" TEXT NOT NULL,
    "expectedTime" "ExpectedTime" NOT NULL,
    "formatPreference" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "contactVisibility" "ContactVisibility" NOT NULL DEFAULT 'VERIFIED_ONLY',
    "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedMatch" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NeedMatchStatus" NOT NULL DEFAULT 'APPLIED',
    "firstConfirmerId" TEXT,
    "firstConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "liabilityAgreed" BOOLEAN,
    "liabilityDecidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "dealType" "DealType" NOT NULL,
    "dealId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "action" "ReportAction",
    "resolverId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ViolationSource" NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_status_createdAt_idx" ON "Item"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Item_sellerId_idx" ON "Item"("sellerId");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "ItemInterest_itemId_createdAt_idx" ON "ItemInterest"("itemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ItemInterest_itemId_userId_key" ON "ItemInterest"("itemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemDeal_itemId_key" ON "ItemDeal"("itemId");

-- CreateIndex
CREATE INDEX "ItemDeal_sellerId_idx" ON "ItemDeal"("sellerId");

-- CreateIndex
CREATE INDEX "ItemDeal_buyerId_idx" ON "ItemDeal"("buyerId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_itemId_key" ON "Favorite"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Service_status_createdAt_idx" ON "Service"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");

-- CreateIndex
CREATE INDEX "ServiceSlot_serviceId_startAt_idx" ON "ServiceSlot"("serviceId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlot_serviceId_startAt_endAt_key" ON "ServiceSlot"("serviceId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Booking_serviceId_status_idx" ON "Booking"("serviceId", "status");

-- CreateIndex
CREATE INDEX "Booking_clientId_status_idx" ON "Booking"("clientId", "status");

-- CreateIndex
CREATE INDEX "Booking_status_firstConfirmedAt_idx" ON "Booking"("status", "firstConfirmedAt");

-- CreateIndex
CREATE INDEX "Need_status_createdAt_idx" ON "Need"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Need_requesterId_idx" ON "Need"("requesterId");

-- CreateIndex
CREATE INDEX "NeedMatch_needId_status_idx" ON "NeedMatch"("needId", "status");

-- CreateIndex
CREATE INDEX "NeedMatch_providerId_status_idx" ON "NeedMatch"("providerId", "status");

-- CreateIndex
CREATE INDEX "NeedMatch_status_firstConfirmedAt_idx" ON "NeedMatch"("status", "firstConfirmedAt");

-- CreateIndex
CREATE INDEX "Review_revieweeId_revealed_idx" ON "Review"("revieweeId", "revealed");

-- CreateIndex
CREATE UNIQUE INDEX "Review_dealType_dealId_reviewerId_key" ON "Review"("dealType", "dealId", "reviewerId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Violation_userId_createdAt_idx" ON "Violation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemInterest" ADD CONSTRAINT "ItemInterest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemInterest" ADD CONSTRAINT "ItemInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDeal" ADD CONSTRAINT "ItemDeal_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDeal" ADD CONSTRAINT "ItemDeal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDeal" ADD CONSTRAINT "ItemDeal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSlot" ADD CONSTRAINT "ServiceSlot_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Need" ADD CONSTRAINT "Need_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedMatch" ADD CONSTRAINT "NeedMatch_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedMatch" ADD CONSTRAINT "NeedMatch_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
