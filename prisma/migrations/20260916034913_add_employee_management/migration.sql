/*
  Warnings:

  - The values [CREATE_BUSINESS] on the enum `PermissionEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `BusinessEmployee` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmployeePaymentType" AS ENUM ('DAILY', 'HOURLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EmployeeSettlementStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionEnum_new" AS ENUM ('CREATE_EMPLOYEE', 'EDIT_EMPLOYEE', 'DELETE_EMPLOYEE', 'MANAGE_EMPLOYEE_ROLES', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'MANAGE_PRODUCTS', 'MANAGE_STOCK', 'CREATE_MENU_SECTION', 'EDIT_MENU_SECTION', 'DELETE_MENU_SECTION', 'MANAGE_MENU', 'EDIT_BUSINESS', 'DELETE_BUSINESS', 'VIEW_DASHBOARD', 'VIEW_REPORTS', 'MANAGE_BUSINESS_SETTINGS', 'MANAGE_DELIVERY_ZONES', 'VIEW_ORDERS', 'CREATE_ORDER', 'EDIT_ORDER', 'CANCEL_ORDER', 'PROCESS_ORDER', 'DELIVER_ORDER', 'COMPLETE_ORDER', 'VIEW_CASH_REGISTERS', 'CREATE_CASH_REGISTER', 'EDIT_CASH_REGISTER', 'MANAGE_CASH_REGISTERS', 'OPEN_CASH_REGISTER', 'CLOSE_CASH_REGISTER', 'VIEW_CASH_REGISTER_HISTORY', 'VIEW_TREASURY', 'CREATE_TREASURY_ACCOUNT', 'EDIT_TREASURY_ACCOUNT', 'MANAGE_TREASURY_ACCOUNTS', 'CREATE_FINANCIAL_MOVEMENT', 'VIEW_FINANCIAL_MOVEMENTS', 'CREATE_INTERNAL_TRANSFER', 'VIEW_CUSTOMERS', 'CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'MANAGE_PAYMENT_METHODS');
ALTER TABLE "BusinessRole" ALTER COLUMN "permissions" TYPE "PermissionEnum_new"[] USING ("permissions"::text::"PermissionEnum_new"[]);
ALTER TABLE "BusinessEmployeeOverride" ALTER COLUMN "permission" TYPE "PermissionEnum_new" USING ("permission"::text::"PermissionEnum_new");
ALTER TYPE "PermissionEnum" RENAME TO "PermissionEnum_old";
ALTER TYPE "PermissionEnum_new" RENAME TO "PermissionEnum";
DROP TYPE "PermissionEnum_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "BusinessEmployee" DROP CONSTRAINT "BusinessEmployee_businessId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessEmployee" DROP CONSTRAINT "BusinessEmployee_roleId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessEmployee" DROP CONSTRAINT "BusinessEmployee_userId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessEmployeeOverride" DROP CONSTRAINT "BusinessEmployeeOverride_employeeId_fkey";

-- DropTable
DROP TABLE "BusinessEmployee";

-- CreateTable
CREATE TABLE "empleados_negocio" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "positionId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipo_pago" "EmployeePaymentType" NOT NULL DEFAULT 'DAILY',
    "valor_pago" DECIMAL(12,2) NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT,
    "roleId" TEXT,

    CONSTRAINT "empleados_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "puestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornadas_empleado" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jornadas_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_empleados" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fin" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "status" "EmployeeSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "fecha_pago" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidaciones_empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_negocio_businessId_username_key" ON "empleados_negocio"("businessId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "puestos_businessId_nombre_key" ON "puestos"("businessId", "nombre");

-- CreateIndex
CREATE INDEX "jornadas_empleado_employeeId_inicio_idx" ON "jornadas_empleado"("employeeId", "inicio");

-- CreateIndex
CREATE INDEX "liquidaciones_empleados_employeeId_periodo_inicio_periodo_f_idx" ON "liquidaciones_empleados"("employeeId", "periodo_inicio", "periodo_fin");

-- AddForeignKey
ALTER TABLE "empleados_negocio" ADD CONSTRAINT "empleados_negocio_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "puestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados_negocio" ADD CONSTRAINT "empleados_negocio_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "BusinessRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados_negocio" ADD CONSTRAINT "empleados_negocio_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados_negocio" ADD CONSTRAINT "empleados_negocio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployeeOverride" ADD CONSTRAINT "BusinessEmployeeOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "empleados_negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornadas_empleado" ADD CONSTRAINT "jornadas_empleado_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "empleados_negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_empleados" ADD CONSTRAINT "liquidaciones_empleados_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "empleados_negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
