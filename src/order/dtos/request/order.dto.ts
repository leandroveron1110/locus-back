import { z } from 'zod';
import { OrderStatus, OrderOrigin, PaymentMethodType, PaymentStatus, DeliveryType, CadetPaymentPayer } from '@prisma/client';

export const CreateOrderOptionSchema = z.object({
  optionName: z.string(),
  priceModifierType: z.string(),
  quantity: z.number().int(),
  priceFinal: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Debe ser un número decimal',
  }),
  priceWithoutTaxes: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Debe ser un número decimal',
  }),
  taxesAmount: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Debe ser un número decimal',
  }),
  opcionId: z.string().optional(),
});

export const CreateOrderOptionGroupSchema = z.object({
  groupName: z.string(),
  minQuantity: z.number().int(),
  maxQuantity: z.number().int(),
  quantityType: z.string(),
  opcionGrupoId: z.string().optional(),
  options: z.array(CreateOrderOptionSchema),
});

export const CreateOrderItemSchema = z.object({
  menuProductId: z.string(),
  productName: z.string(),
  productDescription: z.string().optional(),
  productImageUrl: z.string().optional(),
  quantity: z.number().int(),
  priceAtPurchase: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Debe ser un número decimal',
  }),
  notes: z.string().optional(),
  optionGroups: z.array(CreateOrderOptionGroupSchema),
});


// Función de refinamiento reutilizable para Decimal(10, 2)
const decimal2Refine = (val: number | undefined) => {
  if (val === undefined) return true;
  return /^\d+(\.\d{1,2})?$/.test(val.toFixed(2));
};

// Función de refinamiento reutilizable para Decimal(10, 7)
const decimal7Refine = (val: number | undefined) => {
  if (val === undefined) return true;
  return /^\d+(\.\d{1,7})?$/.test(val.toFixed(7));
};

// Definición de tipos de ítems de pago para mayor claridad
export const PaymentItemType = z.enum([
  'ORDER',      // Monto total de productos/servicios
  'DELIVERY',   // Costo de envío
  'DISCOUNT',   // Descuento aplicado (puede ser un monto negativo)
]);

// Definición de quién es el receptor/cobrador del dinero
export const PaymentTarget = z.enum([
  'BUSINESS',   // Recibe/cobrará el negocio (Transferencia, Tarjeta)
  'CADET',      // Recibe/cobrará el cadete (Típicamente efectivo)
  'SYSTEM',     // Monto que va al sistema (e.g., comisiones, si se manejan aquí)
]);

// 1. Esquema del Ítem Individual de Desglose
export const PaymentBreakdownItemSchema = z.object({
  amount: z.number().refine(val => /^\d+(\.\d{1,2})?$/.test(val.toFixed(2)), {
    message: 'El monto debe tener hasta 2 decimales',
  }), // El valor monetario de este componente de pago.
  method: z.enum(PaymentMethodType), // El método de pago utilizado para este monto
  itemType: PaymentItemType, // Indica a qué corresponde este monto
  target: PaymentTarget, // Quién recibe/cobrará este monto
  note: z.string().optional(), // Nota adicional sobre este pago.
});

// 2. Esquema para paymentExpected y paymentReceived
export const PaymentBreakdownSchema = z.array(PaymentBreakdownItemSchema)
  .min(1, 'El desglose de pagos debe contener al menos un ítem.');


export const CreateOrderFullSchema = z.object({
  // --- Relaciones/IDs ---
  userId: z.uuid(), // En Prisma es String (UUID), aquí lo validamos como UUID.
  businessId: z.string().uuid(),
  deliveryAddressId: z.string().uuid().optional(),
  pickupAddressId: z.string().uuid().optional(),
  deliveryCompanyId: z.string().uuid().optional(),

  // --- SNAPSHOTS del cliente ---
  customerName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  customerPhone: z.string().min(6, 'El teléfono del cliente es obligatorio'),
  customerAddress: z.string().optional(),
  customerObservations: z.string().optional(),
  customerAddresslatitude: z.number().optional().refine(decimal7Refine, {
    message: 'La latitud del cliente debe tener hasta 7 decimales',
  }),
  customerAddresslongitude: z.number().optional().refine(decimal7Refine, {
    message: 'La longitud del cliente debe tener hasta 7 decimales',
  }),

  // --- SNAPSHOTS del negocio ---
  businessName: z.string().min(1, 'El nombre del negocio es obligatorio'),
  businessPhone: z.string().min(6, 'El teléfono del negocio es obligatorio'),
  businessAddress: z.string().min(1, 'La dirección del negocio es obligatoria'),
  businessObservations: z.string().optional(),
  businessAddresslatitude: z.number().refine(decimal7Refine, {
    message: 'La latitud del negocio debe tener hasta 7 decimales',
  }),
  businessAddresslongitude: z.number().refine(decimal7Refine, {
    message: 'La longitud del negocio debe tener hasta 7 decimales',
  }),

  // --- SNAPSHOTS de delivery ---
  deliveryCompanyName: z.string().optional(),
  deliveryCompanyPhone: z.string().optional(),

  // --- TOTALES FINALES (ajustados a los nombres de Prisma) ---
  total: z.number().refine(val => decimal2Refine(val), {
    message: 'El total de la orden (sin delivery) debe tener hasta 2 decimales',
  }),
  // Renombrado de 'totalDelivery' a 'totalDeliveryCost'
  totalDeliveryCost: z.number().optional().refine(val => decimal2Refine(val), {
    message: 'El costo total de delivery debe tener hasta 2 decimales',
  }).default(0), // Se puede agregar el default(0) si se espera en el cuerpo de la petición

  // --- DECISIONES Y ESTADOS DEL CLIENTE (Pagos) ---
  // Renombrado de 'paymentType' a 'orderPaymentMethod'
  orderPaymentMethod: z.enum(PaymentMethodType).default(PaymentMethodType.TRANSFER),
  paymentStatus: z.enum(PaymentStatus).default(PaymentStatus.PENDING),

  // Nuevos campos de pago (Cadete)
  cadetPaymentPayer: z.enum(CadetPaymentPayer).optional().default(CadetPaymentPayer.CLIENT),
  cadetPaymentMethod: z.enum(PaymentMethodType).optional(),

  // Detalles del pago
  paymentReceiptUrl: z.url().optional(),
  paymentInstructions: z.string().optional(),
  paymentHolderName: z.string().optional(),

  // Desglose de montos (usamos z.any() o z.record() para JSON)
  paymentExpected: PaymentBreakdownSchema, // Asume que es un objeto/array complejo (JSON)
  paymentReceived: PaymentBreakdownSchema, // Asume que es un objeto/array complejo (JSON)

  // Intervención del Cadete
  isCadetCollectingOrder: z.boolean().optional().default(false),

  // --- METADATA ---
  deliveryType: z.enum(DeliveryType).default(DeliveryType.DELIVERY),
  status: z.enum(OrderStatus).optional().default(OrderStatus.PENDING),
  origin: z.enum(OrderOrigin).optional().default(OrderOrigin.APP),
  isTest: z.boolean().optional().default(false),
  notes: z.string().optional(),

  // Items de la orden (relación)
  items: z.array(CreateOrderItemSchema).min(1, 'La orden debe tener al menos un artículo'),
  // Los OrderDiscount (relación) no se incluyen si se gestionan en otro schema o servicio.
});





export type CreateOrderFullDTO = z.infer<typeof CreateOrderFullSchema>;
export type CreateOrderItemDTO = z.infer<typeof CreateOrderItemSchema>;
export type CreateOrderOptionGroupDTO = z.infer<
  typeof CreateOrderOptionGroupSchema
>;
export type CreateOrderOptionDTO = z.infer<typeof CreateOrderOptionSchema>;

// export type AddressDTO = z.infer<typeof AddressUnionSchema>;
