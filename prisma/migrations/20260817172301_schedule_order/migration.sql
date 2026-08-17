-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "programado_para" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ordenes_negocio_id_programado_para_idx" ON "ordenes"("negocio_id", "programado_para");
