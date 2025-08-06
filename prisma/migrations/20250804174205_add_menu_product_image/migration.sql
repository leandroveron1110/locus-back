/*
  Warnings:

  - You are about to drop the `menu_producto_imagenes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[imagen_id]` on the table `menu_productos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "menu_producto_imagenes" DROP CONSTRAINT "menu_producto_imagenes_menu_producto_id_fkey";

-- AlterTable
ALTER TABLE "menu_productos" ADD COLUMN     "imagen_id" TEXT,
ADD COLUMN     "imagen_url" TEXT;

-- DropTable
DROP TABLE "menu_producto_imagenes";

-- CreateIndex
CREATE UNIQUE INDEX "menu_productos_imagen_id_key" ON "menu_productos"("imagen_id");

-- AddForeignKey
ALTER TABLE "menu_productos" ADD CONSTRAINT "menu_productos_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
