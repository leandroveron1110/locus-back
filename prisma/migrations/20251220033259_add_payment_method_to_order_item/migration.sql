-- AlterTable
ALTER TABLE "items_orden" ADD COLUMN     "metodo_pago_producto" "PaymentMethodType" NOT NULL DEFAULT 'CASH';
