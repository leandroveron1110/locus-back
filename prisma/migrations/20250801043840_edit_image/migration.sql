/*
  Warnings:

  - The primary key for the `opcion_imagenes` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "opcion_imagenes" DROP CONSTRAINT "opcion_imagenes_imagen_id_fkey";

-- AlterTable
ALTER TABLE "opcion_imagenes" DROP CONSTRAINT "opcion_imagenes_pkey",
ADD CONSTRAINT "opcion_imagenes_pkey" PRIMARY KEY ("opcion_id");
