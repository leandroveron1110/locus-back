// src/modules/image/dtos/Request/create-image.dto.ts
import { IsString, IsUrl, IsOptional, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateImageDto {
  @IsString()
  @IsUrl()
  url: string; // URL de la imagen (ej. de Cloudinary)

  @IsString()
  publicId: string; // ID público en el proveedor de almacenamiento (ej. Cloudinary public_id)

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  resourceType?: string; // 'image', 'video', 'raw' - Por defecto en Prisma 'image'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber() // BigInt en Prisma se mapea a number en TypeScript
  bytes?: number;

  @IsOptional()
  @IsString()
  folder?: string;
}