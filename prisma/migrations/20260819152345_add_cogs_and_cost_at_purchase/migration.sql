-- AlterEnum
ALTER TYPE "FinancialMovementType" ADD VALUE 'COGS';

-- DropForeignKey
ALTER TABLE "financial_movements" DROP CONSTRAINT "financial_movements_cash_register_turn_id_fkey";

-- AlterTable
ALTER TABLE "financial_movements" ADD COLUMN     "affects_cash_register" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "cash_register_turn_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "items_orden" ADD COLUMN     "cost_at_purchase" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "menu_productos" ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_cash_register_turn_id_fkey" FOREIGN KEY ("cash_register_turn_id") REFERENCES "cash_register_turns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
