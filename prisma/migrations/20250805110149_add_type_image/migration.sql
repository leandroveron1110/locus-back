/*
  Warnings:

  - The values [GALERY] on the enum `ImageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ImageType_new" AS ENUM ('MENU_PRODUCT', 'AVATAR', 'GENERAL', 'GALLERY');
ALTER TABLE "imagenes" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "imagenes" ALTER COLUMN "type" TYPE "ImageType_new" USING ("type"::text::"ImageType_new");
ALTER TYPE "ImageType" RENAME TO "ImageType_old";
ALTER TYPE "ImageType_new" RENAME TO "ImageType";
DROP TYPE "ImageType_old";
ALTER TABLE "imagenes" ALTER COLUMN "type" SET DEFAULT 'GENERAL';
COMMIT;
