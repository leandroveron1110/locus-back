-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PermissionEnum" ADD VALUE 'VIEW_ORDERS';
ALTER TYPE "PermissionEnum" ADD VALUE 'CREATE_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'EDIT_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'CANCEL_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'PROCESS_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'DELIVER_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'COMPLETE_ORDER';
ALTER TYPE "PermissionEnum" ADD VALUE 'MANAGE_DELIVERY_ZONES';
