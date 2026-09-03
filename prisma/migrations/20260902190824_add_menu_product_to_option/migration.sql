-- AlterTable
ALTER TABLE "opciones" ADD COLUMN     "menuProductId" TEXT;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
