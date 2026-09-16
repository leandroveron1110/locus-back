/*
  Warnings:

  - A unique constraint covering the columns `[businessId,username]` on the table `BusinessEmployee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `BusinessEmployee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `BusinessEmployee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `BusinessEmployee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `BusinessEmployee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BusinessEmployee" DROP CONSTRAINT "BusinessEmployee_userId_fkey";

-- DropIndex
DROP INDEX "BusinessEmployee_businessId_userId_key";

-- AlterTable
ALTER TABLE "BusinessEmployee" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEmployee_businessId_username_key" ON "BusinessEmployee"("businessId", "username");

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
