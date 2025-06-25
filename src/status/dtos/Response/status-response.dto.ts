import { Status as PrismaStatus } from '@prisma/client'; // Importa el tipo Status de Prisma

export class StatusResponseDto {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  entityType: string;
  isFinal: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  // Método estático para crear una instancia de StatusResponseDto desde un objeto Prisma Status
  static fromPrisma(status: PrismaStatus): StatusResponseDto {
    const dto = new StatusResponseDto();
    dto.id = status.id;
    dto.name = status.name;
    dto.displayName = status.displayName;
    dto.description = status.description ?? undefined;
    dto.entityType = status.entityType;
    dto.isFinal = status.isFinal;
    dto.order = status.order;
    dto.createdAt = status.createdAt;
    dto.updatedAt = status.updatedAt;
    return dto;
  }
}