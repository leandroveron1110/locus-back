/*
  Warnings:

  - Added the required column `cliente_nombre` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cliente_telefono` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negocio_direccion` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negocio_nombre` to the `ordenes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `negocio_telefono` to the `ordenes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "cliente_direccion" TEXT,
ADD COLUMN     "cliente_nombre" TEXT NOT NULL,
ADD COLUMN     "cliente_observaciones" TEXT,
ADD COLUMN     "cliente_telefono" TEXT NOT NULL,
ADD COLUMN     "negocio_direccion" TEXT NOT NULL,
ADD COLUMN     "negocio_nombre" TEXT NOT NULL,
ADD COLUMN     "negocio_observaciones" TEXT,
ADD COLUMN     "negocio_telefono" TEXT NOT NULL;
