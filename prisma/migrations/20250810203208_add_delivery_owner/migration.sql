/*
  Warnings:

  - Added the required column `ownerId` to the `DeliveryCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryCompany" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DeliveryCompany" ADD CONSTRAINT "DeliveryCompany_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
