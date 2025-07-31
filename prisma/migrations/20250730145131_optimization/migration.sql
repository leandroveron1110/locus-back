/*
  Warnings:

  - You are about to drop the `contenido_modulos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eventos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horarios_especiales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `menu_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `menu_secciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pedido_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pedidos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producto_imagenes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "contenido_modulos" DROP CONSTRAINT "contenido_modulos_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos" DROP CONSTRAINT "eventos_imagen_id_fkey";

-- DropForeignKey
ALTER TABLE "eventos" DROP CONSTRAINT "eventos_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "horarios_especiales" DROP CONSTRAINT "horarios_especiales_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_imagen_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_seccion_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_secciones" DROP CONSTRAINT "menu_secciones_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "pedido_items" DROP CONSTRAINT "pedido_items_pedido_id_fkey";

-- DropForeignKey
ALTER TABLE "pedido_items" DROP CONSTRAINT "pedido_items_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "producto_imagenes" DROP CONSTRAINT "producto_imagenes_imagen_id_fkey";

-- DropForeignKey
ALTER TABLE "producto_imagenes" DROP CONSTRAINT "producto_imagenes_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_imagen_id_fkey";

-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT "productos_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_negocio_id_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_servicio_ofrecido_id_fkey";

-- DropTable
DROP TABLE "contenido_modulos";

-- DropTable
DROP TABLE "eventos";

-- DropTable
DROP TABLE "horarios_especiales";

-- DropTable
DROP TABLE "menu_items";

-- DropTable
DROP TABLE "menu_secciones";

-- DropTable
DROP TABLE "pedido_items";

-- DropTable
DROP TABLE "pedidos";

-- DropTable
DROP TABLE "producto_imagenes";

-- DropTable
DROP TABLE "productos";

-- DropTable
DROP TABLE "reservas";
