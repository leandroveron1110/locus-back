/*
  Warnings:

  - You are about to drop the column `client_turn_id` on the `cash_register_turns` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_temp]` on the table `cash_register_turns` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_temp` to the `cash_register_turns` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "cash_register_turns_client_turn_id_key";

-- AlterTable
ALTER TABLE "cash_register_turns" DROP COLUMN "client_turn_id",
ADD COLUMN     "id_temp" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cash_register_turns_id_temp_key" ON "cash_register_turns"("id_temp");
