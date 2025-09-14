-- AlterTable
ALTER TABLE "menu_productos" ADD COLUMN     "disponible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tiempo_preparacion" INTEGER;
