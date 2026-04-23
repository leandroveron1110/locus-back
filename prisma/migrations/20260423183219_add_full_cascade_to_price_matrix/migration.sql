-- DropForeignKey
ALTER TABLE "delivery_price_matrix" DROP CONSTRAINT "delivery_price_matrix_deliveryCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_price_matrix" DROP CONSTRAINT "delivery_price_matrix_deliveryZoneId_fkey";

-- DropForeignKey
ALTER TABLE "delivery_price_matrix" DROP CONSTRAINT "delivery_price_matrix_macroZoneId_fkey";

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_macroZoneId_fkey" FOREIGN KEY ("macroZoneId") REFERENCES "macro_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
