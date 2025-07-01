// src/modules/image/dtos/Response/image-response.dto.ts
import { Image } from '@prisma/client'; // Importa el tipo de Prisma para 'Image'

export class ImageResponseDto {
  id: string;
  url: string;
  publicId: string;
  format?: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromPrisma(image: Image): ImageResponseDto {
    const dto = new ImageResponseDto();
    dto.id = image.id;
    dto.url = image.url;
    dto.publicId = image.publicId;
    dto.format = image.format ?? undefined;
    dto.resourceType = image.resourceType;
    dto.width = image.width ?? undefined;
    dto.height = image.height ?? undefined;
    dto.bytes = image.bytes ? Number(image.bytes) : undefined; // Convertir BigInt a Number
    dto.folder = image.folder ?? undefined;
    dto.createdAt = image.createdAt;
    dto.updatedAt = image.updatedAt;
    return dto;
  }
}