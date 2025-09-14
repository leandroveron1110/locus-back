-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "cadeteria_nombre" TEXT,
ADD COLUMN     "cadeteria_telefono" TEXT,
ADD COLUMN     "cliente_direccion_latitud" DECIMAL(10,7),
ADD COLUMN     "cliente_direccion_longitud" DECIMAL(10,7),
ADD COLUMN     "negocio_direccion_latitud" DECIMAL(10,7) NOT NULL DEFAULT 0,
ADD COLUMN     "negocio_direccion_longitud" DECIMAL(10,7) NOT NULL DEFAULT 0,
ADD COLUMN     "total_delivery" DECIMAL(10,2);
