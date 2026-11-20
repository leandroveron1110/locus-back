/*
  Warnings:

  - A unique constraint covering the columns `[courierNumber]` on the table `Courier` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Courier" ADD COLUMN     "courierNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Courier_courierNumber_key" ON "Courier"("courierNumber");
