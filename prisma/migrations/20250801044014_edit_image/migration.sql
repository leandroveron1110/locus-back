/*
  Warnings:

  - The primary key for the `menu_producto_imagenes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `imagen_id` on the `menu_producto_imagenes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "menu_producto_imagenes" DROP CONSTRAINT "menu_producto_imagenes_imagen_id_fkey";

-- AlterTable
ALTER TABLE "menu_producto_imagenes" DROP CONSTRAINT "menu_producto_imagenes_pkey",
DROP COLUMN "imagen_id",
ADD CONSTRAINT "menu_producto_imagenes_pkey" PRIMARY KEY ("menu_producto_id");
