/*
  Warnings:

  - The values [CREATE_RESERVATION,EDIT_RESERVATION] on the enum `PermissionEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionEnum_new" AS ENUM ('CREATE_EMPLOYEE', 'EDIT_EMPLOYEE', 'DELETE_EMPLOYEE', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'MANAGE_PRODUCTS', 'CREATE_BUSINESS', 'EDIT_BUSINESS', 'DELETE_BUSINESS', 'VIEW_DASHBOARD', 'CLOSE_CASH_REGISTER', 'VIEW_REPORTS', 'MANAGE_DELIVERY_ZONES', 'VIEW_ORDERS', 'CREATE_ORDER', 'EDIT_ORDER', 'CANCEL_ORDER', 'PROCESS_ORDER', 'DELIVER_ORDER', 'COMPLETE_ORDER');
ALTER TABLE "BusinessRole" ALTER COLUMN "permissions" TYPE "PermissionEnum_new"[] USING ("permissions"::text::"PermissionEnum_new"[]);
ALTER TABLE "BusinessEmployeeOverride" ALTER COLUMN "permission" TYPE "PermissionEnum_new" USING ("permission"::text::"PermissionEnum_new");
ALTER TYPE "PermissionEnum" RENAME TO "PermissionEnum_old";
ALTER TYPE "PermissionEnum_new" RENAME TO "PermissionEnum";
DROP TYPE "PermissionEnum_old";
COMMIT;
