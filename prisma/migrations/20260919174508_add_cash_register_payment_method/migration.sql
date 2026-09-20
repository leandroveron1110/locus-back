/*
  Warnings:

  - You are about to drop the column `closing_notes` on the `cash_register_turns` table. All the data in the column will be lost.
  - You are about to drop the column `client_movement_id` on the `financial_movements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_temp]` on the table `financial_movements` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "financial_movements_client_movement_id_key";

-- AlterTable
ALTER TABLE "cash_register_turns" DROP COLUMN "closing_notes",
ADD COLUMN     "closingNotes" TEXT,
ALTER COLUMN "opening_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closing_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "financial_movements" DROP COLUMN "client_movement_id",
ADD COLUMN     "id_temp" TEXT,
ALTER COLUMN "payment_method" DROP NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cash_register_payment_methods" (
    "id" TEXT NOT NULL,
    "id_temp" TEXT,
    "business_id" TEXT NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "payment_method" "PaymentMethodTypeFinancial" NOT NULL,
    "treasury_account_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cash_register_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_register_payment_methods_id_temp_key" ON "cash_register_payment_methods"("id_temp");

-- CreateIndex
CREATE INDEX "cash_register_payment_methods_business_id_idx" ON "cash_register_payment_methods"("business_id");

-- CreateIndex
CREATE INDEX "cash_register_payment_methods_cash_register_id_idx" ON "cash_register_payment_methods"("cash_register_id");

-- CreateIndex
CREATE INDEX "cash_register_payment_methods_treasury_account_id_idx" ON "cash_register_payment_methods"("treasury_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_register_payment_methods_cash_register_id_payment_meth_key" ON "cash_register_payment_methods"("cash_register_id", "payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "financial_movements_id_temp_key" ON "financial_movements"("id_temp");

-- AddForeignKey
ALTER TABLE "cash_register_payment_methods" ADD CONSTRAINT "cash_register_payment_methods_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_payment_methods" ADD CONSTRAINT "cash_register_payment_methods_treasury_account_id_fkey" FOREIGN KEY ("treasury_account_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
