import { z } from 'zod';

export const CreateAddressSchema = z.object({
  street: z.string().min(1),
  number: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  country: z.string().default('Argentina'),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean().optional(),
  userId: z.uuid().optional(),
  businessId: z.uuid().optional(),
});

export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();

export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
