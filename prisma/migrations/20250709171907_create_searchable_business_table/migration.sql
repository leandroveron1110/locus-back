-- CreateTable
CREATE TABLE "negocios_busqueda" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion_completa" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "nombres_categorias" TEXT[],
    "nombres_tags" TEXT[],
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "promedio_calificacion" DECIMAL(2,1),
    "cantidad_calificaciones" INTEGER DEFAULT 0,
    "estado" TEXT,
    "url_logo" TEXT,
    "horarios" JSONB,
    "modulos_config" JSONB,
    "fecha_creacion_original" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_sincronizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocios_busqueda_pkey" PRIMARY KEY ("id")
);
