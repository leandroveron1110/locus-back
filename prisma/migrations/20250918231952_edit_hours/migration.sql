/*
  Warnings:

  - You are about to drop the `horarios_semanales` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "horarios_semanales" DROP CONSTRAINT "horarios_semanales_negocio_id_fkey";

-- AlterTable
ALTER TABLE "negocios" ADD COLUMN     "horarios" JSONB;

-- DropTable
DROP TABLE "horarios_semanales";
