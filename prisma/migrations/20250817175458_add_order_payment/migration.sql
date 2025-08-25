-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('TRANSFER', 'CASH', 'DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CONFIRMED', 'REJECTED');

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "paymentHolderName" TEXT,
ADD COLUMN     "paymentInstructions" TEXT,
ADD COLUMN     "paymentReceiptUrl" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paymentType" "PaymentMethodType" NOT NULL DEFAULT 'TRANSFER';

-- CreateTable
CREATE TABLE "metodos_pago_negocio" (
    "id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "cuenta" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "instrucciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodos_pago_negocio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metodos_pago_negocio" ADD CONSTRAINT "metodos_pago_negocio_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
