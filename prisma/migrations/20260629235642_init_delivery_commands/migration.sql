-- CreateEnum
CREATE TYPE "DeliveryCommandType" AS ENUM ('QUOTE', 'DISPATCH', 'CANCEL');

-- CreateEnum
CREATE TYPE "DeliveryCommandStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'CANCELLED');

-- CreateTable
CREATE TABLE "DeliveryCommand" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "orderId" TEXT,
    "command" "DeliveryCommandType" NOT NULL,
    "status" "DeliveryCommandStatus" NOT NULL DEFAULT 'PENDING',
    "originName" TEXT,
    "originAddress" TEXT,
    "originLatitude" DOUBLE PRECISION,
    "originLongitude" DOUBLE PRECISION,
    "destinationAddress" TEXT,
    "destinationLatitude" DOUBLE PRECISION,
    "destinationLongitude" DOUBLE PRECISION,
    "zoneId" TEXT,
    "notes" TEXT,
    "quotedCost" INTEGER,
    "externalId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryCommand_businessId_idx" ON "DeliveryCommand"("businessId");

-- CreateIndex
CREATE INDEX "DeliveryCommand_orderId_idx" ON "DeliveryCommand"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryCommand_status_idx" ON "DeliveryCommand"("status");

-- CreateIndex
CREATE INDEX "DeliveryCommand_command_idx" ON "DeliveryCommand"("command");
