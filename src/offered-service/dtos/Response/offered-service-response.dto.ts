import { OfferedService as PrismaOfferedService } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class OfferedServiceResponseDto {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  price?: Decimal;
  durationMinutes?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromPrisma(service: PrismaOfferedService): OfferedServiceResponseDto {
    const dto = new OfferedServiceResponseDto();
    dto.id = service.id;
    dto.name = service.name;
    dto.description = service.description ?? undefined;
    dto.businessId = service.businessId;
    dto.price = service.price ?? undefined;
    dto.durationMinutes = service.durationMinutes ?? undefined;
    dto.isActive = service.active;
    dto.createdAt = service.createdAt;
    dto.updatedAt = service.updatedAt;
    return dto;
  }
}