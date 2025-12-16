-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('MENU_PRODUCT', 'AVATAR', 'GENERAL', 'GALLERY');

-- CreateEnum
CREATE TYPE "PermissionEnum" AS ENUM ('CREATE_EMPLOYEE', 'EDIT_EMPLOYEE', 'DELETE_EMPLOYEE', 'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'MANAGE_PRODUCTS', 'CREATE_BUSINESS', 'EDIT_BUSINESS', 'DELETE_BUSINESS', 'VIEW_DASHBOARD', 'CLOSE_CASH_REGISTER', 'VIEW_REPORTS', 'MANAGE_DELIVERY_ZONES', 'VIEW_ORDERS', 'CREATE_ORDER', 'EDIT_ORDER', 'CANCEL_ORDER', 'PROCESS_ORDER', 'DELIVER_ORDER', 'COMPLETE_ORDER');

-- CreateEnum
CREATE TYPE "DeliveryEmployeeRole" AS ENUM ('DRIVER', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDER', 'PRODUCT', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'DELIVERY', 'IN_HOUSE_DELIVERY', 'EXTERNAL_DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'WAITING_FOR_PAYMENT', 'PAYMENT_IN_PROGRESS', 'PAYMENT_CONFIRMED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED_BY_BUSINESS', 'PREPARING', 'READY_FOR_CUSTOMER_PICKUP', 'READY_FOR_DELIVERY_PICKUP', 'DELIVERY_PENDING', 'DELIVERY_ASSIGNED', 'DELIVERY_ACCEPTED', 'DELIVERY_REJECTED', 'DELIVERY_REASSIGNING', 'OUT_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'REFUNDED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_BUSINESS', 'CANCELLED_BY_DELIVERY', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('APP', 'WEB', 'WHATSAPP', 'PHONE', 'IN_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('TRANSFER', 'CASH', 'QR', 'OTHER');

-- CreateEnum
CREATE TYPE "CadetPaymentPayer" AS ENUM ('BUSINESS', 'CLIENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "estados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_visual" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_entidad" TEXT NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "estado_id" TEXT,
    "avatar_id" TEXT,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "alt" TEXT,
    "descripcion" TEXT,
    "etiquetas" TEXT[],
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "formato" TEXT,
    "tipo_recurso" TEXT NOT NULL DEFAULT 'image',
    "ancho" INTEGER,
    "alto" INTEGER,
    "bytes" BIGINT,
    "carpeta" TEXT,
    "es_imagen_personalizada" BOOLEAN NOT NULL DEFAULT false,
    "type" "ImageType" NOT NULL DEFAULT 'GENERAL',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio_imagenes" (
    "negocio_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,
    "url" TEXT,

    CONSTRAINT "negocio_imagenes_pkey" PRIMARY KEY ("negocio_id","imagen_id")
);

-- CreateTable
CREATE TABLE "negocio_categorias" (
    "negocio_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_categorias_pkey" PRIMARY KEY ("negocio_id","categoria_id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessFollower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio_tag" (
    "businessId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_tag_pkey" PRIMARY KEY ("businessId","tagId")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_ofrecidos" (
    "id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2),
    "duracion_minutos" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "servicios_ofrecidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocios" (
    "id" TEXT NOT NULL,
    "propietario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion_completa" TEXT,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "estado_id" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "url_instagram" TEXT,
    "url_facebook" TEXT,
    "url_web" TEXT,
    "modulos_config" JSONB DEFAULT '{}',
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "promedio_calificacion" DECIMAL(2,1),
    "cantidad_calificaciones" INTEGER DEFAULT 0,
    "logo_id" TEXT,
    "logo_url" TEXT,
    "horarios" JSONB,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
    "acepta_efectivo" BOOLEAN NOT NULL DEFAULT true,
    "acepta_transferencia" BOOLEAN NOT NULL DEFAULT true,
    "acepta_qr" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "negocios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_pago_negocio" (
    "id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "cuenta" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "instrucciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),

    CONSTRAINT "metodos_pago_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRole" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "PermissionEnum"[],

    CONSTRAINT "BusinessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEmployee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "roleId" TEXT,

    CONSTRAINT "BusinessEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEmployeeOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "permission" "PermissionEnum" NOT NULL,
    "allowed" BOOLEAN NOT NULL,

    CONSTRAINT "BusinessEmployeeOverride_pkey" PRIMARY KEY ("id")
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
    "cantidad_seguidores" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion_original" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_sincronizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocios_busqueda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "urls_imagenes" TEXT[],
    "menu_id" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "precio_original" DECIMAL(10,2),
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "mascara_moneda" TEXT NOT NULL DEFAULT '$',
    "precio_sin_impuestos" DECIMAL(10,2),
    "monto_impuestos" DECIMAL(10,2),
    "monto_descuento" DECIMAL(10,2),
    "porcentaje_descuento" DECIMAL(5,2),
    "tipo_descuento" TEXT[],
    "imagen_id" TEXT,
    "imagen_url" TEXT,
    "calificacion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tiempo_preparacion" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "tiene_opciones" BOOLEAN NOT NULL DEFAULT false,
    "es_mas_pedido" BOOLEAN NOT NULL DEFAULT false,
    "es_recomendado" BOOLEAN NOT NULL DEFAULT false,
    "seccion_id" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "acepta_efectivo" BOOLEAN NOT NULL DEFAULT true,
    "acepta_transferencia" BOOLEAN NOT NULL DEFAULT true,
    "acepta_qr" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "menu_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_comida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_comida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_producto_categorias_comida" (
    "menu_producto_id" TEXT NOT NULL,
    "categoria_comida_id" TEXT NOT NULL,

    CONSTRAINT "menu_producto_categorias_comida_pkey" PRIMARY KEY ("menu_producto_id","categoria_comida_id")
);

-- CreateTable
CREATE TABLE "opciones_grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad_minima" INTEGER NOT NULL,
    "cantidad_maxima" INTEGER NOT NULL,
    "tipo_cantidad" TEXT NOT NULL,
    "menu_producto_id" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
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
    "precio_final" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "precio_sin_impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "monto_impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "tipo_modificador_precio" TEXT NOT NULL,
    "cantidad_maxima" INTEGER,
    "id_grupo_opcion" TEXT NOT NULL,
    "borrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_borrado" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcion_imagenes" (
    "opcion_id" TEXT NOT NULL,
    "imagen_id" TEXT NOT NULL,
    "orden" INTEGER,
    "url" TEXT NOT NULL,

    CONSTRAINT "opcion_imagenes_pkey" PRIMARY KEY ("opcion_id")
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT,
    "departamento" TEXT,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Argentina',
    "codigo_postal" TEXT,
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "es_predeterminada" BOOLEAN NOT NULL DEFAULT false,
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "usuario_id" TEXT,
    "negocio_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "negocio_id" TEXT NOT NULL,
    "direccion_entrega_id" TEXT,
    "direccion_retiro_id" TEXT,
    "deliveryCompanyId" TEXT,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_telefono" TEXT NOT NULL,
    "cliente_direccion" TEXT,
    "cliente_observaciones" TEXT,
    "cliente_direccion_latitud" DECIMAL(10,7),
    "cliente_direccion_longitud" DECIMAL(10,7),
    "negocio_nombre" TEXT NOT NULL,
    "negocio_telefono" TEXT NOT NULL,
    "negocio_direccion" TEXT NOT NULL,
    "negocio_observaciones" TEXT,
    "negocio_direccion_latitud" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "negocio_direccion_longitud" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "cadeteria_nombre" TEXT,
    "cadeteria_telefono" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "costo_total_delivery" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "metodo_pago_orden" "PaymentMethodType" NOT NULL DEFAULT 'TRANSFER',
    "estado_pago_orden" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "quien_paga_cadete" "CadetPaymentPayer" NOT NULL DEFAULT 'CLIENT',
    "metodo_pago_cadete" "PaymentMethodType",
    "paymentReceiptUrl" TEXT,
    "paymentInstructions" TEXT,
    "paymentHolderName" TEXT,
    "pago_esperado" JSONB NOT NULL,
    "pago_recibido" JSONB NOT NULL,
    "cadete_cobra_orden" BOOLEAN NOT NULL DEFAULT false,
    "tipo_entrega" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
    "estado" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "origen" "OrderOrigin" NOT NULL DEFAULT 'APP',
    "es_prueba" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden" (
    "id" TEXT NOT NULL,
    "id_orden" TEXT NOT NULL,
    "id_menu_producto" TEXT NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "descripcion_producto" TEXT,
    "url_imagen_producto" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precio_al_momento_compra" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "ordersId" TEXT,

    CONSTRAINT "items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos_orden" (
    "id" TEXT NOT NULL,
    "id_orden" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "notas" TEXT,
    "pagado_por" TEXT,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "ordersId" TEXT,

    CONSTRAINT "descuentos_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderOptionGroup" (
    "id" TEXT NOT NULL,
    "opcionGrupoId" TEXT,
    "groupName" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER NOT NULL,
    "quantityType" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,

    CONSTRAINT "OrderOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderOption" (
    "id" TEXT NOT NULL,
    "orderOptionGroupId" TEXT NOT NULL,
    "opcionId" TEXT,
    "optionName" TEXT NOT NULL,
    "priceFinal" DECIMAL(10,2) NOT NULL,
    "priceWithoutTaxes" DECIMAL(10,2) NOT NULL,
    "taxesAmount" DECIMAL(10,2) NOT NULL,
    "priceModifierType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "priority" "NotificationPriority" DEFAULT 'MEDIUM',
    "targetEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL DEFAULT 'USER',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscriptionTarget" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,

    CONSTRAINT "PushSubscriptionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "geometry" JSONB,
    "hasTimeLimit" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AddressToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AddressToOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "estados_nombre_tipo_entidad_key" ON "estados"("nombre", "tipo_entidad");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_avatar_id_key" ON "usuarios"("avatar_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "imagenes_public_id_key" ON "imagenes"("public_id");

-- CreateIndex
CREATE INDEX "imagenes_es_imagen_personalizada_type_idx" ON "imagenes"("es_imagen_personalizada", "type");

-- CreateIndex
CREATE INDEX "imagenes_carpeta_idx" ON "imagenes"("carpeta");

-- CreateIndex
CREATE INDEX "imagenes_nombre_idx" ON "imagenes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_businessId_userId_key" ON "Rating"("businessId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessFollower_userId_businessId_key" ON "BusinessFollower"("userId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nombre_key" ON "tags"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "negocios_logo_id_key" ON "negocios"("logo_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEmployee_businessId_userId_key" ON "BusinessEmployee"("businessId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "menus_negocio_id_nombre_key" ON "menus"("negocio_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_comida_nombre_key" ON "categorias_comida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_legacy_id_key" ON "opciones"("legacy_id");

-- CreateIndex
CREATE INDEX "direcciones_usuario_id_idx" ON "direcciones"("usuario_id");

-- CreateIndex
CREATE INDEX "direcciones_negocio_id_idx" ON "direcciones"("negocio_id");

-- CreateIndex
CREATE INDEX "direcciones_habilitada_idx" ON "direcciones"("habilitada");

-- CreateIndex
CREATE INDEX "direcciones_usuario_id_habilitada_idx" ON "direcciones"("usuario_id", "habilitada");

-- CreateIndex
CREATE INDEX "ordenes_negocio_id_idx" ON "ordenes"("negocio_id");

-- CreateIndex
CREATE INDEX "ordenes_usuario_id_idx" ON "ordenes"("usuario_id");

-- CreateIndex
CREATE INDEX "ordenes_deliveryCompanyId_idx" ON "ordenes"("deliveryCompanyId");

-- CreateIndex
CREATE INDEX "ordenes_creado_en_idx" ON "ordenes"("creado_en");

-- CreateIndex
CREATE INDEX "Notification_targetEntityId_targetEntityType_isRead_timesta_idx" ON "Notification"("targetEntityId", "targetEntityType", "isRead", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "Notification_targetEntityId_targetEntityType_isRead_idx" ON "Notification"("targetEntityId", "targetEntityType", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscriptionTarget_targetEntityId_targetEntityType_idx" ON "PushSubscriptionTarget"("targetEntityId", "targetEntityType");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscriptionTarget_subscriptionId_targetEntityId_target_key" ON "PushSubscriptionTarget"("subscriptionId", "targetEntityId", "targetEntityType");

-- CreateIndex
CREATE INDEX "_AddressToOrder_B_index" ON "_AddressToOrder"("B");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_imagenes" ADD CONSTRAINT "negocio_imagenes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_imagenes" ADD CONSTRAINT "negocio_imagenes_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_categorias" ADD CONSTRAINT "negocio_categorias_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_categorias" ADD CONSTRAINT "negocio_categorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFollower" ADD CONSTRAINT "BusinessFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessFollower" ADD CONSTRAINT "BusinessFollower_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_tag" ADD CONSTRAINT "negocio_tag_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_tag" ADD CONSTRAINT "negocio_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_ofrecidos" ADD CONSTRAINT "servicios_ofrecidos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_pago_negocio" ADD CONSTRAINT "metodos_pago_negocio_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "BusinessRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployeeOverride" ADD CONSTRAINT "BusinessEmployeeOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEmployee" ADD CONSTRAINT "DeliveryEmployee_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEmployee" ADD CONSTRAINT "DeliveryEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_productos" ADD CONSTRAINT "menu_productos_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_productos" ADD CONSTRAINT "menu_productos_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_categorias_comida" ADD CONSTRAINT "menu_producto_categorias_comida_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_producto_categorias_comida" ADD CONSTRAINT "menu_producto_categorias_comida_categoria_comida_id_fkey" FOREIGN KEY ("categoria_comida_id") REFERENCES "categorias_comida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_grupos" ADD CONSTRAINT "opciones_grupos_menu_producto_id_fkey" FOREIGN KEY ("menu_producto_id") REFERENCES "menu_productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones" ADD CONSTRAINT "opciones_id_grupo_opcion_fkey" FOREIGN KEY ("id_grupo_opcion") REFERENCES "opciones_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcion_imagenes" ADD CONSTRAINT "opcion_imagenes_opcion_id_fkey" FOREIGN KEY ("opcion_id") REFERENCES "opciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_direccion_entrega_id_fkey" FOREIGN KEY ("direccion_entrega_id") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_direccion_retiro_id_fkey" FOREIGN KEY ("direccion_retiro_id") REFERENCES "direcciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden" ADD CONSTRAINT "items_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden" ADD CONSTRAINT "items_orden_id_menu_producto_fkey" FOREIGN KEY ("id_menu_producto") REFERENCES "menu_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_orden" ADD CONSTRAINT "descuentos_orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderOptionGroup" ADD CONSTRAINT "OrderOptionGroup_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "items_orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderOption" ADD CONSTRAINT "OrderOption_orderOptionGroupId_fkey" FOREIGN KEY ("orderOptionGroupId") REFERENCES "OrderOptionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscriptionTarget" ADD CONSTRAINT "PushSubscriptionTarget_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryCompany" ADD CONSTRAINT "DeliveryCompany_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddressToOrder" ADD CONSTRAINT "_AddressToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "direcciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddressToOrder" ADD CONSTRAINT "_AddressToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
