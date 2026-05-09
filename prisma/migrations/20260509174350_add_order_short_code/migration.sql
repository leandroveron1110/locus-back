/*
  Warnings:

  - The values [WAITING_FOR_PAYMENT,PAYMENT_IN_PROGRESS,PAYMENT_CONFIRMED,PENDING_CONFIRMATION,REJECTED_BY_BUSINESS,READY_FOR_CUSTOMER_PICKUP,READY_FOR_DELIVERY_PICKUP,DELIVERY_PENDING,DELIVERY_ASSIGNED,DELIVERY_ACCEPTED,DELIVERY_REJECTED,DELIVERY_REASSIGNING,OUT_FOR_PICKUP,PICKED_UP,OUT_FOR_DELIVERY,DELIVERED,DELIVERY_FAILED,RETURNED,REFUNDED,CANCELLED_BY_USER,CANCELLED_BY_BUSINESS,CANCELLED_BY_DELIVERY,FAILED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'REQUESTED', 'SHIPPED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StateType" AS ENUM ('ORDER', 'PAYMENT', 'DELIVERY');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "ordenes" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "ordenes" ALTER COLUMN "estado" TYPE "OrderStatus_new" USING ("estado"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "ordenes" ALTER COLUMN "estado" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "dailyNumber" INTEGER,
ADD COLUMN     "estado_envio" "DeliveryStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "shortCode" TEXT;

-- CreateTable
CREATE TABLE "ordenes_eventos_estado" (
    "id" TEXT NOT NULL,
    "orden_id" TEXT NOT NULL,
    "tipo_estado" "StateType" NOT NULL,
    "valor" TEXT NOT NULL,
    "autor" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_eventos_estado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ordenes_eventos_estado_orden_id_idx" ON "ordenes_eventos_estado"("orden_id");

-- AddForeignKey
ALTER TABLE "ordenes_eventos_estado" ADD CONSTRAINT "ordenes_eventos_estado_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
