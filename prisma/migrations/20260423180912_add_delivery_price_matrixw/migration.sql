/*
  Warnings:

  - You are about to drop the column `barrioId` on the `address_zone_index` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "address_zone_index" DROP CONSTRAINT "address_zone_index_barrioId_fkey";

-- AlterTable
ALTER TABLE "address_zone_index" DROP COLUMN "barrioId",
ADD COLUMN     "deliveryZoneId" TEXT;

-- AddForeignKey
ALTER TABLE "address_zone_index" ADD CONSTRAINT "address_zone_index_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
