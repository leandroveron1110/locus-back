-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('MENU_PRODUCT', 'AVATAR', 'GENERAL', 'GALERY');

-- AlterTable
ALTER TABLE "imagenes" ADD COLUMN     "type" "ImageType" NOT NULL DEFAULT 'GENERAL';
