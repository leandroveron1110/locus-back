/*
  Warnings:

  - You are about to drop the column `fecha_actualizacion` on the `direcciones` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `direcciones` table. All the data in the column will be lost.
  - You are about to drop the column `entregado_por_negocio` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `estado_id` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_actualizacion` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `id_direccion_entrega` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `max_minutos_entrega` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `metodo_pago` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `min_minutos_entrega` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `modo_entrega` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_comida` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_comida_sin_descuento` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_descuento` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_envio` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_tarifa_servicio` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `monto_total` on the `ordenes` table. All the data in the column will be lost.
  - You are about to drop the column `telefono_direccion` on the `ordenes` table. All the data in the column will be lost.
  - Added the required column `actualizado_en` to the `direcciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualizado_en` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `ordenes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'IN_HOUSE_DELIVERY', 'EXTERNAL_DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('APP', 'WEB', 'WHATSAPP', 'PHONE', 'IN_PERSON', 'OTHER');

-- DropForeignKey
ALTER TABLE "direcciones" DROP CONSTRAINT "direcciones_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "direcciones" DROP CONSTRAINT "direcciones_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "ordenes" DROP CONSTRAINT "ordenes_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "ordenes" DROP CONSTRAINT "ordenes_id_direccion_entrega_fkey";

-- AlterTable
ALTER TABLE "direcciones" DROP COLUMN "fecha_actualizacion",
DROP COLUMN "fecha_creacion",
ADD COLUMN     "actualizado_en" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "habilitada" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ordenes" DROP COLUMN "entregado_por_negocio",
DROP COLUMN "estado_id",
DROP COLUMN "fecha_actualizacion",
DROP COLUMN "fecha_creacion",
DROP COLUMN "id_direccion_entrega",
DROP COLUMN "max_minutos_entrega",
DROP COLUMN "metodo_pago",
DROP COLUMN "min_minutos_entrega",
DROP COLUMN "modo_entrega",
DROP COLUMN "monto_comida",
DROP COLUMN "monto_comida_sin_descuento",
DROP COLUMN "monto_descuento",
DROP COLUMN "monto_envio",
DROP COLUMN "monto_tarifa_servicio",
DROP COLUMN "monto_total",
DROP COLUMN "telefono_direccion",
ADD COLUMN     "actualizado_en" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "direccion_entrega_id" TEXT,
ADD COLUMN     "direccion_retiro_id" TEXT,
ADD COLUMN     "es_prueba" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estado" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "origen" "OrderOrigin" NOT NULL DEFAULT 'APP',
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "DeliveryCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zones" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeliveryCompanyOrders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DeliveryCompanyOrders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DeliveryCompanyOrders_B_index" ON "_DeliveryCompanyOrders"("B");

-- CreateIndex
CREATE INDEX "direcciones_usuario_id_idx" ON "direcciones"("usuario_id");

-- CreateIndex
CREATE INDEX "direcciones_negocio_id_idx" ON "direcciones"("negocio_id");

-- CreateIndex
CREATE INDEX "direcciones_habilitada_idx" ON "direcciones"("habilitada");

-- CreateIndex
CREATE INDEX "direcciones_usuario_id_habilitada_idx" ON "direcciones"("usuario_id", "habilitada");

-- CreateIndex
CREATE INDEX "ordenes_negocio_id_idx" ON "ordenes"("negocio_id");

-- CreateIndex
CREATE INDEX "ordenes_usuario_id_idx" ON "ordenes"("usuario_id");

-- CreateIndex
CREATE INDEX "ordenes_estado_idx" ON "ordenes"("estado");

-- CreateIndex
CREATE INDEX "ordenes_creado_en_idx" ON "ordenes"("creado_en");

-- CreateIndex
CREATE INDEX "ordenes_origen_idx" ON "ordenes"("origen");

-- CreateIndex
CREATE INDEX "ordenes_es_prueba_idx" ON "ordenes"("es_prueba");

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_direccion_entrega_id_fkey" FOREIGN KEY ("direccion_entrega_id") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_direccion_retiro_id_fkey" FOREIGN KEY ("direccion_retiro_id") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryCompanyOrders" ADD CONSTRAINT "_DeliveryCompanyOrders_A_fkey" FOREIGN KEY ("A") REFERENCES "DeliveryCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryCompanyOrders" ADD CONSTRAINT "_DeliveryCompanyOrders_B_fkey" FOREIGN KEY ("B") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
