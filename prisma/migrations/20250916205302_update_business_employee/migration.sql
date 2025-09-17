/*
  Warnings:

  - You are about to drop the column `createdAt` on the `BusinessEmployee` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `BusinessEmployee` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `BusinessEmployee` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PermissionEnum" AS ENUM ('VIEW_DASHBOARD', 'CREATE_RESERVATION', 'EDIT_RESERVATION', 'CLOSE_CASH_REGISTER', 'VIEW_REPORTS', 'MANAGE_PRODUCTS');

-- AlterTable
ALTER TABLE "BusinessEmployee" DROP COLUMN "createdAt",
DROP COLUMN "permissions",
DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT;

-- DropEnum
DROP TYPE "BusinessEmployeeRole";

-- CreateTable
CREATE TABLE "BusinessRole" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "PermissionEnum"[],

    CONSTRAINT "BusinessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEmployeeOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "permission" "PermissionEnum" NOT NULL,
    "allowed" BOOLEAN NOT NULL,

    CONSTRAINT "BusinessEmployeeOverride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "BusinessRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployeeOverride" ADD CONSTRAINT "BusinessEmployeeOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
