/*
  Warnings:

  - You are about to drop the column `icono_id` on the `categorias` table. All the data in the column will be lost.
  - You are about to drop the column `categoria_id` on the `negocios` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "categorias" DROP CONSTRAINT "categorias_icono_id_fkey";

-- DropForeignKey
ALTER TABLE "negocios" DROP CONSTRAINT "negocios_categoria_id_fkey";

-- DropIndex
DROP INDEX "categorias_icono_id_key";

-- AlterTable
ALTER TABLE "categorias" DROP COLUMN "icono_id";

-- AlterTable
ALTER TABLE "negocios" DROP COLUMN "categoria_id";

-- CreateTable
CREATE TABLE "negocio_categorias" (
    "negocio_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_categorias_pkey" PRIMARY KEY ("negocio_id","categoria_id")
);

-- AddForeignKey
ALTER TABLE "negocio_categorias" ADD CONSTRAINT "negocio_categorias_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_categorias" ADD CONSTRAINT "negocio_categorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
