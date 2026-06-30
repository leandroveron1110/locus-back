/*
  Warnings:

  - A unique constraint covering the columns `[businessId,orderId]` on the table `DeliveryCommand` will be added. If there are existing duplicate values, this will fail.
  - Made the column `orderId` on table `DeliveryCommand` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DeliveryCommand" ALTER COLUMN "orderId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryCommand_businessId_orderId_key" ON "DeliveryCommand"("businessId", "orderId");
