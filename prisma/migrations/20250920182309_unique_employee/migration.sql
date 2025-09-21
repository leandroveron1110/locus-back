/*
  Warnings:

  - A unique constraint covering the columns `[businessId,userId]` on the table `BusinessEmployee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BusinessEmployee_businessId_userId_key" ON "BusinessEmployee"("businessId", "userId");
