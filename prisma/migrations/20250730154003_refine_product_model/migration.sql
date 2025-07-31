-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "legacyId" INTEGER,
    "nombre" TEXT NOT NULL,
    "id_comida_barata" TEXT,
    "descuentos_globales" JSONB,
    "negocio_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "es_campana" BOOLEAN NOT NULL DEFAULT false,
    "es_comida_individual" BOOLEAN NOT NULL DEFAULT false,
    "es_asociacion" BOOLEAN NOT NULL DEFAULT false,
    "es_plus" BOOLEAN NOT NULL DEFAULT false,
    "requiere_verificacion_edad" BOOLEAN NOT NULL DEFAULT false,
    "id_campana" TEXT,
    "id_canal" TEXT,
    "urls_imagenes" TEXT[],
    "menu_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "precio_original" DECIMAL(10,2),
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "mascara_moneda" TEXT NOT NULL DEFAULT '$',
    "precio_sin_impuestos" DECIMAL(10,2),
    "monto_impuestos" DECIMAL(10,2),
    "monto_descuento" DECIMAL(10,2),
    "porcentaje_descuento" DECIMAL(5,2),
    "tipo_descuento" TEXT[],
    "es_imagen_personalizada" BOOLEAN NOT NULL DEFAULT false,
    "calificacion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tiene_opciones" BOOLEAN NOT NULL DEFAULT false,
    "es_favorito" BOOLEAN NOT NULL DEFAULT false,
    "es_mas_pedido" BOOLEAN NOT NULL DEFAULT false,
    "es_recomendado" BOOLEAN NOT NULL DEFAULT false,
    "es_super_producto" BOOLEAN NOT NULL DEFAULT false,
    "requiere_verificacion_edad" BOOLEAN NOT NULL DEFAULT false,
    "seccion_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFoodCategory" (
    "productId" TEXT NOT NULL,
    "foodCategoryId" TEXT NOT NULL,

    CONSTRAINT "ProductFoodCategory_pkey" PRIMARY KEY ("productId","foodCategoryId")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "producto_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("producto_id","imagen_id")
);

-- CreateTable
CREATE TABLE "informacion_nutricional" (
    "id" TEXT NOT NULL,
    "etiquetas_dieta" TEXT[],
    "producto_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "informacion_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "desc_pildora_mas_votada" TEXT,
    "nombre_pildora_mas_votada" TEXT,
    "no_me_gusta" INTEGER NOT NULL DEFAULT 0,
    "me_gusta" INTEGER NOT NULL DEFAULT 0,
    "porcentaje_me_gusta" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "producto_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_grupos" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "cantidad_minima" INTEGER NOT NULL,
    "cantidad_maxima" INTEGER NOT NULL,
    "tipo_cantidad" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opciones_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones" (
    "id" TEXT NOT NULL,
    "legacy_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "tiene_stock" BOOLEAN NOT NULL,
    "orden" INTEGER NOT NULL,
    "precio_final" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "precio_sin_impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "monto_impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tipo_modificador_precio" TEXT NOT NULL,
    "requiere_verificacion_edad" BOOLEAN NOT NULL DEFAULT false,
    "cantidad_maxima" INTEGER,
    "etiquetas" TEXT[],
    "id_grupo_opcion" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcion_imagenes" (
    "opcion_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "opcion_imagenes_pkey" PRIMARY KEY ("opcion_id","imagen_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "menus_legacyId_key" ON "menus"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "menus_negocio_id_key" ON "menus"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "secciones_legacy_id_key" ON "secciones"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_legacy_id_key" ON "productos"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_name_key" ON "FoodCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "informacion_nutricional_producto_id_key" ON "informacion_nutricional"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_producto_id_key" ON "feedbacks"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_grupos_legacy_id_key" ON "opciones_grupos"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_legacy_id_key" ON "opciones"("legacy_id");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFoodCategory" ADD CONSTRAINT "ProductFoodCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFoodCategory" ADD CONSTRAINT "ProductFoodCategory_foodCategoryId_fkey" FOREIGN KEY ("foodCategoryId") REFERENCES "FoodCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacion_nutricional" ADD CONSTRAINT "informacion_nutricional_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_grupos" ADD CONSTRAINT "opciones_grupos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_id_grupo_opcion_fkey" FOREIGN KEY ("id_grupo_opcion") REFERENCES "opciones_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcion_imagenes" ADD CONSTRAINT "opcion_imagenes_opcion_id_fkey" FOREIGN KEY ("opcion_id") REFERENCES "opciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcion_imagenes" ADD CONSTRAINT "opcion_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
