/*
  Warnings:

  - You are about to drop the `_DeliveryCompanyOrders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DeliveryCompanyOrders" DROP CONSTRAINT "_DeliveryCompanyOrders_A_fkey";

-- DropForeignKey
ALTER TABLE "_DeliveryCompanyOrders" DROP CONSTRAINT "_DeliveryCompanyOrders_B_fkey";

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "deliveryCompanyId" TEXT;

-- DropTable
DROP TABLE "_DeliveryCompanyOrders";

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
