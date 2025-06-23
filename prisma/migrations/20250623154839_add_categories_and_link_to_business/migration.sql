/*
  Warnings:

  - You are about to drop the column `rubro` on the `negocios` table. All the data in the column will be lost.
  - Added the required column `categoria_id` to the `negocios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "negocios" DROP COLUMN "rubro",
ADD COLUMN     "categoria_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url_icono" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
