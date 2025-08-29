-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menu_productos" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "metodos_pago_negocio" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "negocios" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "opciones" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "opciones_grupos" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "secciones" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "borrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_borrado" TIMESTAMP(3);
