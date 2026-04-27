-- CreateTable
CREATE TABLE "h3_indices" (
    "id" TEXT NOT NULL,
    "h3Index" TEXT NOT NULL,
    "macroZoneId" TEXT,
    "deliveryZoneId" TEXT,

    CONSTRAINT "h3_indices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "h3_indices_h3Index_idx" ON "h3_indices"("h3Index");

-- AddForeignKey
ALTER TABLE "h3_indices" ADD CONSTRAINT "h3_indices_macroZoneId_fkey" FOREIGN KEY ("macroZoneId") REFERENCES "macro_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h3_indices" ADD CONSTRAINT "h3_indices_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
