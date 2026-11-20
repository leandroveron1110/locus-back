-- CreateEnum
CREATE TYPE "CommandAssignmentStatus" AS ENUM ('ASSIGNED', 'GOING_TO_PICKUP', 'PICKED_UP', 'DELIVERED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'BICYCLE', 'CAR', 'ON_FOOT');

-- CreateTable
CREATE TABLE "DeliveryCommandAssignment" (
    "id" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "status" "CommandAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "DeliveryCommandAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'MOTORCYCLE',
    "status" "CourierStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryCommandAssignment_courierId_status_idx" ON "DeliveryCommandAssignment"("courierId", "status");

-- CreateIndex
CREATE INDEX "DeliveryCommandAssignment_commandId_status_idx" ON "DeliveryCommandAssignment"("commandId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryCommandAssignment_commandId_courierId_key" ON "DeliveryCommandAssignment"("commandId", "courierId");

-- CreateIndex
CREATE UNIQUE INDEX "Courier_dni_key" ON "Courier"("dni");

-- CreateIndex
CREATE INDEX "Courier_status_isAvailable_idx" ON "Courier"("status", "isAvailable");

-- AddForeignKey
ALTER TABLE "DeliveryCommandAssignment" ADD CONSTRAINT "DeliveryCommandAssignment_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "DeliveryCommandV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryCommandAssignment" ADD CONSTRAINT "DeliveryCommandAssignment_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
