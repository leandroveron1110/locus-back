/*
  Warnings:

  - Added the required column `url` to the `menu_producto_imagenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `opcion_imagenes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menu_producto_imagenes" ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "opcion_imagenes" ADD COLUMN     "url" TEXT NOT NULL;
