/*
  Warnings:

  - Added the required column `cash_register_id_temp` to the `cash_register_payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cash_register_payment_methods" ADD COLUMN     "cash_register_id_temp" TEXT NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "cash_register_payment_methods_cash_register_id_temp_idx" ON "cash_register_payment_methods"("cash_register_id_temp");

-- CreateIndex
CREATE INDEX "cash_register_payment_methods_treasury_account_id_temp_idx" ON "cash_register_payment_methods"("treasury_account_id_temp");
