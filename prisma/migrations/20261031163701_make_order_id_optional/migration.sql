-- DropIndex
DROP INDEX "DeliveryCommandV2_businessId_orderId_key";

-- AlterTable
ALTER TABLE "DeliveryCommandV2" ALTER COLUMN "orderId" DROP NOT NULL;
