/*
  Warnings:

  - A unique constraint covering the columns `[negocio_id,nombre]` on the table `menus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "menus_negocio_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "menus_negocio_id_nombre_key" ON "menus"("negocio_id", "nombre");
