-- AlterTable
ALTER TABLE "DeliveryZone" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "hasTimeLimit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startTime" TEXT;
