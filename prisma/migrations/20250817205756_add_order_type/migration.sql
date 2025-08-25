-- AlterEnum
ALTER TYPE "DeliveryType" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "tipo_entrega" "DeliveryType" NOT NULL DEFAULT 'PICKUP';
