/*
  Warnings:

  - You are about to drop the column `es_favorito` on the `menu_productos` table. All the data in the column will be lost.
  - You are about to drop the column `es_super_producto` on the `menu_productos` table. All the data in the column will be lost.
  - You are about to drop the column `legacy_id` on the `menu_productos` table. All the data in the column will be lost.
  - You are about to drop the column `requiere_verificacion_edad` on the `menu_productos` table. All the data in the column will be lost.
  - You are about to drop the column `descuentos_globales` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `id_comida_barata` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `legacyId` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `etiquetas` on the `opciones` table. All the data in the column will be lost.
  - You are about to drop the column `requiere_verificacion_edad` on the `opciones` table. All the data in the column will be lost.
  - You are about to drop the column `legacy_id` on the `opciones_grupos` table. All the data in the column will be lost.
  - You are about to drop the column `es_asociacion` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `es_campana` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `es_comida_individual` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `es_plus` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `id_campana` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `id_canal` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `legacy_id` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the column `requiere_verificacion_edad` on the `secciones` table. All the data in the column will be lost.
  - You are about to drop the `feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `informacion_nutricional` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_menu_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "informacion_nutricional" DROP CONSTRAINT "informacion_nutricional_menu_producto_id_fkey";

-- DropIndex
DROP INDEX "menu_productos_legacy_id_key";

-- DropIndex
DROP INDEX "menus_legacyId_key";

-- DropIndex
DROP INDEX "opciones_grupos_legacy_id_key";

-- DropIndex
DROP INDEX "secciones_legacy_id_key";

-- AlterTable
ALTER TABLE "menu_productos" DROP COLUMN "es_favorito",
DROP COLUMN "es_super_producto",
DROP COLUMN "legacy_id",
DROP COLUMN "requiere_verificacion_edad";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "descuentos_globales",
DROP COLUMN "id_comida_barata",
DROP COLUMN "legacyId";

-- AlterTable
ALTER TABLE "opciones" DROP COLUMN "etiquetas",
DROP COLUMN "requiere_verificacion_edad";

-- AlterTable
ALTER TABLE "opciones_grupos" DROP COLUMN "legacy_id";

-- AlterTable
ALTER TABLE "secciones" DROP COLUMN "es_asociacion",
DROP COLUMN "es_campana",
DROP COLUMN "es_comida_individual",
DROP COLUMN "es_plus",
DROP COLUMN "id_campana",
DROP COLUMN "id_canal",
DROP COLUMN "legacy_id",
DROP COLUMN "requiere_verificacion_edad";

-- DropTable
DROP TABLE "feedbacks";

-- DropTable
DROP TABLE "informacion_nutricional";

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT,
    "departamento" TEXT,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Argentina',
    "codigo_postal" TEXT,
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "es_predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "usuario_id" TEXT,
    "negocio_id" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "estado_id" TEXT NOT NULL,
    "monto_comida" DECIMAL(10,2) NOT NULL,
    "monto_comida_sin_descuento" DECIMAL(10,2) NOT NULL,
    "monto_envio" DECIMAL(10,2) NOT NULL,
    "monto_tarifa_servicio" DECIMAL(10,2) NOT NULL,
    "monto_descuento" DECIMAL(10,2) NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "modo_entrega" TEXT NOT NULL,
    "id_direccion_entrega" TEXT,
    "entregado_por_negocio" BOOLEAN,
    "min_minutos_entrega" INTEGER,
    "max_minutos_entrega" INTEGER,
    "telefono_direccion" TEXT,
    "metodo_pago" TEXT NOT NULL,
    "notas" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden" (
    "id" TEXT NOT NULL,
    "id_orden" TEXT NOT NULL,
    "id_menu_producto" TEXT NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "descripcion_producto" TEXT,
    "url_imagen_producto" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precio_al_momento_compra" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos_orden" (
    "id" TEXT NOT NULL,
    "id_orden" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "notas" TEXT,
    "pagado_por" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "descuentos_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderOptionGroup" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "opcionGrupoId" TEXT,
    "groupName" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL,
    "quantityType" TEXT NOT NULL,

    CONSTRAINT "OrderOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderOption" (
    "id" TEXT NOT NULL,
    "orderOptionGroupId" TEXT NOT NULL,
    "opcionId" TEXT,
    "optionName" TEXT NOT NULL,
    "priceFinal" DECIMAL(10,2) NOT NULL,
    "priceWithoutTaxes" DECIMAL(10,2) NOT NULL,
    "taxesAmount" DECIMAL(10,2) NOT NULL,
    "priceModifierType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_id_direccion_entrega_fkey" FOREIGN KEY ("id_direccion_entrega") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden" ADD CONSTRAINT "items_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden" ADD CONSTRAINT "items_orden_id_menu_producto_fkey" FOREIGN KEY ("id_menu_producto") REFERENCES "menu_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_orden" ADD CONSTRAINT "descuentos_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderOptionGroup" ADD CONSTRAINT "OrderOptionGroup_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "items_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderOption" ADD CONSTRAINT "OrderOption_orderOptionGroupId_fkey" FOREIGN KEY ("orderOptionGroupId") REFERENCES "OrderOptionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
