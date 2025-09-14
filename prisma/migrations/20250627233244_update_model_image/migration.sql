/*
  Warnings:

  - You are about to drop the column `url_icono` on the `categorias` table. All the data in the column will be lost.
  - You are about to drop the column `imagen_url` on the `eventos` table. All the data in the column will be lost.
  - You are about to drop the column `imagen_url` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `negocios` table. All the data in the column will be lost.
  - You are about to drop the column `galeria_urls` on the `negocios` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `negocios` table. All the data in the column will be lost.
  - You are about to drop the column `estado_pedido` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `imagen_url` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `reservas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[icono_id]` on the table `categorias` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imagen_id]` on the table `eventos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imagen_id]` on the table `menu_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logo_id]` on the table `negocios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imagen_id]` on the table `productos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatar_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `estado_id` to the `reservas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categorias" DROP COLUMN "url_icono",
ADD COLUMN     "icono_id" TEXT;

-- AlterTable
ALTER TABLE "eventos" DROP COLUMN "imagen_url",
ADD COLUMN     "imagen_id" TEXT;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "imagen_url",
ADD COLUMN     "imagen_id" TEXT;

-- AlterTable
ALTER TABLE "negocios" DROP COLUMN "estado",
DROP COLUMN "galeria_urls",
DROP COLUMN "logo_url",
ADD COLUMN     "estado_id" TEXT,
ADD COLUMN     "logo_id" TEXT;

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "estado_pedido",
ADD COLUMN     "estado_id" TEXT;

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "imagen_url",
ADD COLUMN     "imagen_id" TEXT;

-- AlterTable
ALTER TABLE "reservas" DROP COLUMN "estado",
ADD COLUMN     "estado_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "avatar_id" TEXT,
ADD COLUMN     "estado_id" TEXT;

-- CreateTable
CREATE TABLE "estados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_visual" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_entidad" TEXT NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "formato" TEXT,
    "tipo_recurso" TEXT NOT NULL DEFAULT 'image',
    "ancho" INTEGER,
    "alto" INTEGER,
    "bytes" BIGINT,
    "carpeta" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio_imagenes" (
    "negocio_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "negocio_imagenes_pkey" PRIMARY KEY ("negocio_id","imagen_id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "producto_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("producto_id","imagen_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estados_nombre_tipo_entidad_key" ON "estados"("nombre", "tipo_entidad");

-- CreateIndex
CREATE UNIQUE INDEX "imagenes_public_id_key" ON "imagenes"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_icono_id_key" ON "categorias"("icono_id");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_imagen_id_key" ON "eventos"("imagen_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_imagen_id_key" ON "menu_items"("imagen_id");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_logo_id_key" ON "negocios"("logo_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_imagen_id_key" ON "productos"("imagen_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_avatar_id_key" ON "usuarios"("avatar_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_icono_id_fkey" FOREIGN KEY ("icono_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_imagenes" ADD CONSTRAINT "negocio_imagenes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_imagenes" ADD CONSTRAINT "negocio_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
