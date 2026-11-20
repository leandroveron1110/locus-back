-- AlterTable
ALTER TABLE "DeliveryCommandV2" ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ALTER COLUMN "businessId" DROP NOT NULL;
