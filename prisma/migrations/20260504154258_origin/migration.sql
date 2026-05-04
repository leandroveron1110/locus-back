/*
  Warnings:

  - The values [WHATSAPP,PHONE,IN_PERSON,OTHER] on the enum `OrderOrigin` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderOrigin_new" AS ENUM ('APP', 'WEB', 'BUSINESS');
ALTER TABLE "ordenes" ALTER COLUMN "origen" DROP DEFAULT;
ALTER TABLE "ordenes" ALTER COLUMN "origen" TYPE "OrderOrigin_new" USING ("origen"::text::"OrderOrigin_new");
ALTER TYPE "OrderOrigin" RENAME TO "OrderOrigin_old";
ALTER TYPE "OrderOrigin_new" RENAME TO "OrderOrigin";
DROP TYPE "OrderOrigin_old";
ALTER TABLE "ordenes" ALTER COLUMN "origen" SET DEFAULT 'APP';
COMMIT;
