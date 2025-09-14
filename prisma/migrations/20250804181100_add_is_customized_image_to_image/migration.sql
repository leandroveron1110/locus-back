/*
  Warnings:

  - You are about to drop the column `es_imagen_personalizada` on the `menu_productos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "imagenes" ADD COLUMN     "es_imagen_personalizada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "menu_productos" DROP COLUMN "es_imagen_personalizada";
