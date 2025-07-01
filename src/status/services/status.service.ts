// src/modules/status/services/status.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStatusDto } from '../dtos/Request/create-status.dto';
import { StatusResponseDto } from '../dtos/Response/status-response.dto';
import { EntityType } from 'src/common/enums/entity-type.enum';
import { UpdateStatusDto } from '../dtos/Request/update-status.dto';

@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo estado para una entidad específica.
   * Asegura que no haya estados con el mismo nombre y tipo de entidad.
   * @param createStatusDto Datos para crear el estado.
   * @returns El estado creado.
   * @throws ConflictException Si ya existe un estado con el mismo nombre para el mismo tipo de entidad.
   */
  async create(createStatusDto: CreateStatusDto): Promise<StatusResponseDto> {
    const { name, entityType } = createStatusDto;

    // Verificar si ya existe un estado con el mismo nombre y tipo de entidad
    const existingStatus = await this.prisma.status.findUnique({
      where: {
        name_entityType: { // Usa el @@unique definido en Prisma schema
          name: name,
          entityType: entityType,
        },
      },
    });

    if (existingStatus) {
      throw new ConflictException(`Status with name "${name}" for entity type "${entityType}" already exists.`);
    }

    const status = await this.prisma.status.create({
      data: createStatusDto,
    });
    return StatusResponseDto.fromPrisma(status);
  }

  /**
   * Obtiene todos los estados, opcionalmente filtrados por tipo de entidad.
   * @param entityType (Opcional) El tipo de entidad para el cual se desean listar los estados.
   * @returns Una lista de DTOs de respuesta de estados.
   */
  async findAll(entityType?: EntityType): Promise<StatusResponseDto[]> { // <-- Usa EntityType
    const statuses = await this.prisma.status.findMany({
      where: {
        entityType: entityType, // Aplica el filtro si entityType está presente
      },
      orderBy: {
        order: 'asc', // Ordena los estados por su campo 'order'
      }
    });
    return statuses.map(StatusResponseDto.fromPrisma);
  }

  /**
   * Obtiene un estado por su ID.
   * @param id ID del estado.
   * @returns El estado encontrado.
   * @throws NotFoundException Si el estado no se encuentra.
   */
  async findOne(id: string): Promise<StatusResponseDto> {
    const status = await this.prisma.status.findUnique({
      where: { id },
    });
    if (!status) {
      throw new NotFoundException(`Status with ID "${id}" not found.`);
    }
    return StatusResponseDto.fromPrisma(status);
  }

  /**
   * Obtiene un estado por su nombre y tipo de entidad.
   * @param name Nombre técnico del estado.
   * @param entityType El tipo de entidad a la que se aplica el estado (ej. EntityType.BUSINESS).
   * @returns El objeto Status encontrado.
   * @throws NotFoundException Si el estado no es encontrado para el nombre y tipo de entidad especificados.
   */
  async findByNameAndEntityType(name: string, entityType: EntityType): Promise<StatusResponseDto> { // <-- Usa EntityType y retorna StatusResponseDto
    const status = await this.prisma.status.findUnique({
      where: {
        name_entityType: {
          name: name,
          entityType: entityType,
        },
      },
    });
    if (!status) {
      throw new NotFoundException(`Status with name "${name}" and entity type "${entityType}" not found.`);
    }
    return StatusResponseDto.fromPrisma(status); // Retorna el DTO de respuesta
  }

  /**
   * Actualiza un estado existente.
   * @param id ID del estado a actualizar.
   * @param updateStatusDto Datos para actualizar el estado.
   * @returns El estado actualizado.
   * @throws NotFoundException Si el estado no se encuentra.
   * @throws ConflictException Si la actualización genera un conflicto de unicidad (nombre + entityType).
   */
  async update(id: string, updateStatusDto: UpdateStatusDto): Promise<StatusResponseDto> {
    // Si se intenta cambiar el nombre o el entityType, verificar conflicto
    if (updateStatusDto.name || updateStatusDto.entityType) {
      const currentStatus = await this.findOne(id); // Obtener el estado actual
      const newName = updateStatusDto.name ?? currentStatus.name;
      // Asegúrate de que newEntityType sea del tipo correcto (EntityType o string si es necesario)
      const newEntityType = (updateStatusDto.entityType as EntityType) ?? (currentStatus.entityType as EntityType);

      if (newName !== currentStatus.name || newEntityType !== currentStatus.entityType) {
        const conflictStatus = await this.prisma.status.findUnique({
          where: {
            name_entityType: {
              name: newName,
              entityType: newEntityType,
            },
          },
        });
        if (conflictStatus && conflictStatus.id !== id) {
          throw new ConflictException(`Status with name "${newName}" for entity type "${newEntityType}" already exists.`);
        }
      }
    }

    try {
      const updatedStatus = await this.prisma.status.update({
        where: { id },
        data: updateStatusDto,
      });
      return StatusResponseDto.fromPrisma(updatedStatus);
    } catch (error) {
      if (error.code === 'P2025') { // Código de error de Prisma para 'record not found'
        throw new NotFoundException(`Status with ID "${id}" not found.`);
      }
      throw error;
    }
  }

  /**
   * Elimina un estado.
   * Importante: Considera las implicaciones de eliminar un estado que ya está en uso por otras entidades.
   * Podrías necesitar una lógica para "desactivar" en lugar de eliminar, o reasignar estados.
   * @param id ID del estado a eliminar.
   * @throws NotFoundException Si el estado no se encuentra.
   * @throws ConflictException Si el estado está en uso por otras entidades.
   */
  async remove(id: string): Promise<void> {
    // Aquí puedes añadir lógica para verificar si el estado está en uso
    // Antes de eliminar, podrías revisar las tablas User, Business, Booking, Order.
    // Ejemplo:
    const statusInUse = await this.prisma.status.findUnique({
      where: { id },
      include: {
        users: { take: 1 },
        businesses: { take: 1 },
        bookings: { take: 1 },
        orders: { take: 1 },
      },
    });

    if (statusInUse && (statusInUse.users.length > 0 || statusInUse.businesses.length > 0 || statusInUse.bookings.length > 0 || statusInUse.orders.length > 0)) {
        throw new ConflictException(`Status with ID "${id}" cannot be deleted because it is currently in use by other entities.`);
    }

    try {
      await this.prisma.status.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Status with ID "${id}" not found.`);
      }
      throw error;
    }
  }
}
