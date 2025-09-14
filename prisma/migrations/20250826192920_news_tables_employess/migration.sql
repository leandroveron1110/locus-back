-- CreateEnum
CREATE TYPE "BusinessEmployeeRole" AS ENUM ('MANAGER', 'CASHIER', 'WAITER');

-- CreateEnum
CREATE TYPE "DeliveryEmployeeRole" AS ENUM ('DRIVER', 'DISPATCHER');

-- CreateTable
CREATE TABLE "BusinessEmployee" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessEmployeeRole" NOT NULL,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEmployee" (
    "id" TEXT NOT NULL,
    "deliveryCompanyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DeliveryEmployeeRole" NOT NULL,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryEmployee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEmployee" ADD CONSTRAINT "DeliveryEmployee_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEmployee" ADD CONSTRAINT "DeliveryEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
