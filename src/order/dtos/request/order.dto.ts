// zod/create-order.schema.ts
import { z } from 'zod';
import { OrderStatus, OrderOrigin } from '@prisma/client';

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

const AddressCreateSchema = z.object({
  street: z.string(),
  city: z.string(),
  province: z.string(),
});

const AddressUnionSchema = z.union([AddressIdSchema, AddressCreateSchema]);

export const CreateOrderFullSchema = z.object({
  userId: z.uuid(),
  businessId: z.uuid(),
  deliveryAddress: AddressUnionSchema.optional(),
  pickupAddress: AddressUnionSchema.optional(),
  status: z.enum(OrderStatus).optional(),
  isTest: z.boolean().optional(),
  total: z.number().refine((n) => /^\d+(\.\d{1,2})?$/.test(n.toFixed(2)), {
    message: 'El total debe tener hasta 2 decimales',
  }),
  notes: z.string().optional(),
  items: z.array(CreateOrderItemSchema),
});

export const CreateOrderSchema = z.object({
  userId: z.string(),
  businessId: z.string(),
  deliveryAddressId: z.string().optional(),
  pickupAddressId: z.string().optional(),
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

export type AddressDTO = z.infer<typeof AddressUnionSchema>;


