-- CreateTable
CREATE TABLE "macro_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometry" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "macro_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_price_matrix" (
    "id" TEXT NOT NULL,
    "deliveryCompanyId" TEXT NOT NULL,
    "deliveryZoneId" TEXT NOT NULL,
    "macroZoneId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "delivery_price_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_zone_index" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "macroZoneId" TEXT,
    "barrioId" TEXT,

    CONSTRAINT "address_zone_index_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "macro_zones_name_key" ON "macro_zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_price_matrix_deliveryCompanyId_deliveryZoneId_macr_key" ON "delivery_price_matrix"("deliveryCompanyId", "deliveryZoneId", "macroZoneId");

-- CreateIndex
CREATE UNIQUE INDEX "address_zone_index_addressId_key" ON "address_zone_index"("addressId");

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_price_matrix" ADD CONSTRAINT "delivery_price_matrix_macroZoneId_fkey" FOREIGN KEY ("macroZoneId") REFERENCES "macro_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_zone_index" ADD CONSTRAINT "address_zone_index_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "direcciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_zone_index" ADD CONSTRAINT "address_zone_index_macroZoneId_fkey" FOREIGN KEY ("macroZoneId") REFERENCES "macro_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_zone_index" ADD CONSTRAINT "address_zone_index_barrioId_fkey" FOREIGN KEY ("barrioId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
