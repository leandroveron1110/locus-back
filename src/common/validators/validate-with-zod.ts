import { ZodType } from 'zod';
import { BadRequestException } from '@nestjs/common';

export function validateWithZod<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BadRequestException(result.error.format());
  }
  return result.data;
}
