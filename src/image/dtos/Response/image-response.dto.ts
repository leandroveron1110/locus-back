// Si necesitas transformar el objeto de Prisma, importa la clase Transformer
import { Image as PrismaImage } from '@prisma/client'; // Importa el tipo Image de Prisma

export class ImageResponseDto {
  id: string;
  url: string;
  businessId: string;
  type: string;
  provider: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;

  // Método estático para crear una instancia de ImageResponseDto desde un objeto Prisma Image
  static fromPrisma(image: PrismaImage): ImageResponseDto {
    const dto = new ImageResponseDto();
    dto.id = image.id;
    dto.url = image.url;
    dto.businessId = image.businessId;
    dto.type = image.type;
    dto.provider = image.provider;
    dto.order = image.order ?? undefined; // Si es null en Prisma, lo hace undefined
    dto.createdAt = image.createdAt;
    dto.updatedAt = image.updatedAt;
    return dto;
  }
}
