import { z } from 'zod';
import { OrderStatus, OrderOrigin, PaymentMethodType, PaymentStatus, DeliveryType } from '@prisma/client';

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

const AddressIdSchema = z.object({
  id: z.string(),
});

export const CreateOrderFullSchema = z.object({
  userId: z.uuid(),
  businessId: z.uuid(),
  deliveryAddress: AddressIdSchema.optional(),
  pickupAddress: AddressIdSchema.optional(),

  // --- snapshot cliente ---
  customerName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  customerPhone: z.string().min(6, 'El teléfono del cliente es obligatorio'),
  customerAddress: z.string().optional(),
  customerObservations: z.string().optional(),

  // --- snapshot negocio ---
  businessName: z.string().min(1, 'El nombre del negocio es obligatorio'),
  businessPhone: z.string().min(6, 'El teléfono del negocio es obligatorio'),
  businessAddress: z.string().min(1, 'La dirección del negocio es obligatoria'),
  businessObservations: z.string().optional(),

  status: z.enum(OrderStatus).optional(),
  isTest: z.boolean().optional(),
  total: z.number().refine((n) => /^\d+(\.\d{1,2})?$/.test(n.toFixed(2)), {
    message: 'El total debe tener hasta 2 decimales',
  }),
  notes: z.string().optional(),
  items: z.array(CreateOrderItemSchema),

  // --- pagos ---
  paymentType: z.enum(PaymentMethodType).default(PaymentMethodType.TRANSFER),
  paymentStatus: z.enum(PaymentStatus).default(PaymentStatus.PENDING),
  paymentReceiptUrl: z.url().optional(),
  paymentInstructions: z.string().optional(),
  paymentHolderName: z.string().optional(),

  deliveryType: z.enum(DeliveryType).default(DeliveryType.DELIVERY),
});


export const CreateOrderSchema = z.object({
  userId: z.string(),
  businessId: z.string(),
  deliveryAddressId: z.string().optional(),
  pickupAddressId: z.string().optional(),
    // --- snapshot cliente ---
  customerName: z.string().min(1, "El nombre del cliente es obligatorio"),
  customerPhone: z.string().min(6, "El teléfono del cliente es obligatorio"),
  customerAddress: z.string().optional(),
  customerObservations: z.string().optional(),

  // --- snapshot negocio ---
  businessName: z.string().min(1, "El nombre del negocio es obligatorio"),
  businessPhone: z.string().min(6, "El teléfono del negocio es obligatorio"),
  businessAddress: z.string().min(1, "La dirección del negocio es obligatoria"),
  businessObservations: z.string().optional(),

  status: z.enum(OrderStatus).optional(),
  origin: z.enum(OrderOrigin).optional(),
  isTest: z.boolean().optional(),
  total: z.number().refine((n) => /^\d+(\.\d{1,2})?$/.test(n.toFixed(2)), {
    message: 'El total debe tener hasta 2 decimales',
  }),
  notes: z.string().optional(),
});

export const UpdateOrderSchema = CreateOrderSchema.partial();
export type UpdateOrderDTO = z.infer<typeof UpdateOrderSchema>;

export type CreateOrderFullDTO = z.infer<typeof CreateOrderFullSchema>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type CreateOrderItemDTO = z.infer<typeof CreateOrderItemSchema>;
export type CreateOrderOptionGroupDTO = z.infer<
  typeof CreateOrderOptionGroupSchema
>;
export type CreateOrderOptionDTO = z.infer<typeof CreateOrderOptionSchema>;

// export type AddressDTO = z.infer<typeof AddressUnionSchema>;
