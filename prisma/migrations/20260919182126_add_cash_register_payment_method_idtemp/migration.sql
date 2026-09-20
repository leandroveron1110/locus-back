/*
  Warnings:

  - Added the required column `treasury_account_id_temp` to the `cash_register_payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cash_register_payment_methods" ADD COLUMN     "treasury_account_id_temp" TEXT NOT NULL;
