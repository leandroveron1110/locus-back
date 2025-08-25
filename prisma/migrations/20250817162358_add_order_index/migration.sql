-- DropIndex
DROP INDEX "ordenes_es_prueba_idx";

-- DropIndex
DROP INDEX "ordenes_estado_idx";

-- DropIndex
DROP INDEX "ordenes_origen_idx";

-- CreateIndex
CREATE INDEX "ordenes_deliveryCompanyId_idx" ON "ordenes"("deliveryCompanyId");
