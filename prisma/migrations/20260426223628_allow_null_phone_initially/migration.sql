-- DropForeignKey
ALTER TABLE "ordenes" DROP CONSTRAINT "ordenes_usuario_id_fkey";

-- AlterTable
ALTER TABLE "ordenes" ALTER COLUMN "usuario_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "telefono" TEXT;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
