/*
  Warnings:

  - You are about to drop the column `producto_id` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `producto_id` on the `informacion_nutricional` table. All the data in the column will be lost.
  - You are about to alter the column `precio_final` on the `opciones` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `precio_sin_impuestos` on the `opciones` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `monto_impuestos` on the `opciones` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `producto_id` on the `opciones_grupos` table. All the data in the column will be lost.
  - You are about to drop the `FoodCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductFoodCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producto_imagenes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productos` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[menu_producto_id]` on the table `feedbacks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[menu_producto_id]` on the table `informacion_nutricional` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `menu_producto_id` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_producto_id` to the `informacion_nutricional` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_producto_id` to the `opciones_grupos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductFoodCategory" DROP CONSTRAINT "ProductFoodCategory_foodCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductFoodCategory" DROP CONSTRAINT "ProductFoodCategory_productId_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "informacion_nutricional" DROP CONSTRAINT "informacion_nutricional_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "opciones_grupos" DROP CONSTRAINT "opciones_grupos_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "producto_imagenes" DROP CONSTRAINT "producto_imagenes_imagen_id_fkey";

-- DropForeignKey
ALTER TABLE "producto_imagenes" DROP CONSTRAINT "producto_imagenes_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_seccion_id_fkey";

-- DropIndex
DROP INDEX "feedbacks_producto_id_key";

-- DropIndex
DROP INDEX "informacion_nutricional_producto_id_key";

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "producto_id",
ADD COLUMN     "menu_producto_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "informacion_nutricional" DROP COLUMN "producto_id",
ADD COLUMN     "menu_producto_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "opciones" ALTER COLUMN "precio_final" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "precio_sin_impuestos" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "monto_impuestos" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "opciones_grupos" DROP COLUMN "producto_id",
ADD COLUMN     "menu_producto_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "FoodCategory";

-- DropTable
DROP TABLE "ProductFoodCategory";

-- DropTable
DROP TABLE "producto_imagenes";

-- DropTable
DROP TABLE "productos";

-- CreateTable
CREATE TABLE "menu_productos" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "precio_original" DECIMAL(10,2),
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "mascara_moneda" TEXT NOT NULL DEFAULT '$',
    "precio_sin_impuestos" DECIMAL(10,2),
    "monto_impuestos" DECIMAL(10,2),
    "monto_descuento" DECIMAL(10,2),
    "porcentaje_descuento" DECIMAL(5,2),
    "tipo_descuento" TEXT[],
    "es_imagen_personalizada" BOOLEAN NOT NULL DEFAULT false,
    "calificacion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tiene_opciones" BOOLEAN NOT NULL DEFAULT false,
    "es_favorito" BOOLEAN NOT NULL DEFAULT false,
    "es_mas_pedido" BOOLEAN NOT NULL DEFAULT false,
    "es_recomendado" BOOLEAN NOT NULL DEFAULT false,
    "es_super_producto" BOOLEAN NOT NULL DEFAULT false,
    "requiere_verificacion_edad" BOOLEAN NOT NULL DEFAULT false,
    "seccion_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "menu_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_comida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_comida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_producto_categorias_comida" (
    "menu_producto_id" TEXT NOT NULL,
    "categoria_comida_id" TEXT NOT NULL,

    CONSTRAINT "menu_producto_categorias_comida_pkey" PRIMARY KEY ("menu_producto_id","categoria_comida_id")
);

-- CreateTable
CREATE TABLE "menu_producto_imagenes" (
    "menu_producto_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "menu_producto_imagenes_pkey" PRIMARY KEY ("menu_producto_id","imagen_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menu_productos_legacy_id_key" ON "menu_productos"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_comida_nombre_key" ON "categorias_comida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_menu_producto_id_key" ON "feedbacks"("menu_producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "informacion_nutricional_menu_producto_id_key" ON "informacion_nutricional"("menu_producto_id");

-- AddForeignKey
ALTER TABLE "menu_productos" ADD CONSTRAINT "menu_productos_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_categorias_comida" ADD CONSTRAINT "menu_producto_categorias_comida_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_categorias_comida" ADD CONSTRAINT "menu_producto_categorias_comida_categoria_comida_id_fkey" FOREIGN KEY ("categoria_comida_id") REFERENCES "categorias_comida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_imagenes" ADD CONSTRAINT "menu_producto_imagenes_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_imagenes" ADD CONSTRAINT "menu_producto_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacion_nutricional" ADD CONSTRAINT "informacion_nutricional_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_grupos" ADD CONSTRAINT "opciones_grupos_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
