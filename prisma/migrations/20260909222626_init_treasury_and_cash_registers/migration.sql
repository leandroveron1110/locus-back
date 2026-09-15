/*
  Warnings:

  - You are about to drop the column `closingNotes` on the `cash_register_turns` table. All the data in the column will be lost.
  - You are about to drop the column `openingNotes` on the `cash_register_turns` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `financial_movements` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `financial_movements` table. All the data in the column will be lost.
  - Added the required column `cash_register_id` to the `cash_register_turns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasury_account_id` to the `cash_register_turns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `financial_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `financial_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `financial_movements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TreasuryAccountType" AS ENUM ('CASH', 'BANK', 'DIGITAL_WALLET', 'SAFE_BOX');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FinancialMovementType" ADD VALUE 'MERMAS';
ALTER TYPE "FinancialMovementType" ADD VALUE 'INTERNAL_TRANSFER';
ALTER TYPE "FinancialMovementType" ADD VALUE 'INTERNAL_TRANSFER_OUT';
ALTER TYPE "FinancialMovementType" ADD VALUE 'INTERNAL_TRANSFER_IN';

-- DropIndex
DROP INDEX "financial_movements_businessId_idx";

-- DropIndex
DROP INDEX "financial_movements_order_id_idx";

-- AlterTable
ALTER TABLE "cash_register_turns" DROP COLUMN "closingNotes",
DROP COLUMN "openingNotes",
ADD COLUMN     "cash_register_id" TEXT NOT NULL,
ADD COLUMN     "closing_notes" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "opening_notes" TEXT,
ADD COLUMN     "treasury_account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "financial_movements" DROP COLUMN "businessId",
DROP COLUMN "userId",
ADD COLUMN     "business_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fixed_expense_id_temp" TEXT,
ADD COLUMN     "pending_commitment_id_temp" TEXT,
ADD COLUMN     "transfer_group_id" TEXT,
ADD COLUMN     "treasury_account_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "treasury_accounts" (
    "id" TEXT NOT NULL,
    "id_temp" TEXT,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TreasuryAccountType" NOT NULL DEFAULT 'CASH',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "id_temp" TEXT,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_treasury_account_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "treasury_accounts_id_temp_key" ON "treasury_accounts"("id_temp");

-- CreateIndex
CREATE INDEX "treasury_accounts_business_id_idx" ON "treasury_accounts"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_registers_id_temp_key" ON "cash_registers"("id_temp");

-- CreateIndex
CREATE INDEX "cash_registers_business_id_idx" ON "cash_registers"("business_id");

-- CreateIndex
CREATE INDEX "cash_register_turns_cash_register_id_idx" ON "cash_register_turns"("cash_register_id");

-- CreateIndex
CREATE INDEX "financial_movements_business_id_idx" ON "financial_movements"("business_id");

-- CreateIndex
CREATE INDEX "financial_movements_treasury_account_id_idx" ON "financial_movements"("treasury_account_id");

-- CreateIndex
CREATE INDEX "financial_movements_transfer_group_id_idx" ON "financial_movements"("transfer_group_id");

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_default_treasury_account_id_fkey" FOREIGN KEY ("default_treasury_account_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_turns" ADD CONSTRAINT "cash_register_turns_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_turns" ADD CONSTRAINT "cash_register_turns_treasury_account_id_fkey" FOREIGN KEY ("treasury_account_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_treasury_account_id_fkey" FOREIGN KEY ("treasury_account_id") REFERENCES "treasury_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
