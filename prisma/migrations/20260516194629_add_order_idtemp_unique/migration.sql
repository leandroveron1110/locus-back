/*
  Warnings:

  - A unique constraint covering the columns `[id_temp]` on the table `ordenes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ordenes_id_temp_key" ON "ordenes"("id_temp");
