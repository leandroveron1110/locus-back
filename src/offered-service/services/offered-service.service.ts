// src/modules/offered-service/offered-service.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOfferedServiceDto } from '../dtos/Request/create-offered-service.dto';
import { OfferedServiceResponseDto } from '../dtos/Response/offered-service-response.dto';
import { UpdateOfferedServiceDto } from '../dtos/Request/update-offered-service.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { IOfferedServiceService } from '../interfaces/offered-service-service.interface';

@Injectable()
export class OfferedServiceService implements IOfferedServiceService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessService)
    private businessService: IBusinessService,
  ) {}

  /**
   * Crea un nuevo servicio ofrecido para un negocio.
   * @param createOfferedServiceDto Datos para crear el servicio.
   * @returns El servicio ofrecido creado.
   * @throws NotFoundException Si el negocio no existe.
   * @throws ConflictException Si ya existe un servicio con el mismo nombre para el mismo negocio.
   */
  async create(
    createOfferedServiceDto: CreateOfferedServiceDto,
  ): Promise<OfferedServiceResponseDto> {
    const { businessId, name, ...data } = createOfferedServiceDto;

    // 2. Verificar si ya existe un servicio con el mismo nombre para este negocio
    const existingService = await this.prisma.offeredService.findFirst({
      where: {
        businessId: businessId,
        name: {
          equals: name,
          mode: 'insensitive', // Ignorar mayúsculas/minúsculas para el nombre
        },
      },
    });

    if (existingService) {
      throw new ConflictException(
        `Service with name "${name}" already exists for business ID "${businessId}".`,
      );
    }

    const offeredService = await this.prisma.offeredService.create({
      data: {
        ...data,
        name,
        business: {
          connect: { id: businessId }, // Conecta el servicio al negocio existente
        },
      },
    });
    return OfferedServiceResponseDto.fromPrisma(offeredService);
  }

  /**
   * Obtiene todos los servicios ofrecidos, opcionalmente filtrados por negocio o estado de actividad.
   * @param businessId (Opcional) ID del negocio.
   * @param isActive (Opcional) Filtro por estado activo/inactivo.
   * @returns Lista de servicios ofrecidos.
   */
  async findAll(
    businessId?: string,
    isActive?: boolean,
  ): Promise<OfferedServiceResponseDto[]> {
    const services = await this.prisma.offeredService.findMany({
      where: {
        businessId: businessId,
        active: isActive, // Aplica el filtro si isActive está presente
      },
      orderBy: {
        name: 'asc', // Ordenar por nombre
      },
    });
    return services.map(OfferedServiceResponseDto.fromPrisma);
  }

  /**
   * Obtiene un servicio ofrecido por su ID.
   * @param id ID del servicio.
   * @returns El servicio encontrado.
   * @throws NotFoundException Si el servicio no se encuentra.
   */
  async findOne(id: string): Promise<OfferedServiceResponseDto> {
    const service = await this.prisma.offeredService.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException(`OfferedService with ID "${id}" not found.`);
    }
    return OfferedServiceResponseDto.fromPrisma(service);
  }

  /**
   * Obtiene todos los servicios ofrecidos por un negocio específico.
   * @param businessId ID del negocio.
   * @returns Lista de servicios ofrecidos por el negocio.
   * @throws NotFoundException Si el negocio no existe.
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<OfferedServiceResponseDto[]> {
    await this.businessService.findOne(businessId); // Valida que el negocio exista

    const services = await this.prisma.offeredService.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
    return services.map(OfferedServiceResponseDto.fromPrisma);
  }

  /**
   * Actualiza un servicio ofrecido existente.
   * @param id ID del servicio a actualizar.
   * @param updateOfferedServiceDto Datos para actualizar el servicio.
   * @returns El servicio actualizado.
   * @throws NotFoundException Si el servicio no se encuentra.
   * @throws ConflictException Si la actualización genera un conflicto de nombre para el mismo negocio.
   */
  async update(
    id: string,
    updateOfferedServiceDto: UpdateOfferedServiceDto,
  ): Promise<OfferedServiceResponseDto> {
    const { businessId, name, ...data } = updateOfferedServiceDto;

    // Obtener el servicio actual para verificar posibles conflictos
    const currentService = await this.findOne(id);

    // Si se intenta cambiar el businessId o el name, verificar conflicto
    if (businessId || name) {
      const newBusinessId = businessId ?? currentService.businessId;
      const newName = name ?? currentService.name;

      if (
        newBusinessId !== currentService.businessId ||
        newName.toLowerCase() !== currentService.name.toLowerCase()
      ) {
        await this.businessService.findOne(newBusinessId); // Validar nuevo businessId si cambió

        const conflictService = await this.prisma.offeredService.findFirst({
          where: {
            businessId: newBusinessId,
            name: {
              equals: newName,
              mode: 'insensitive',
            },
          },
        });

        if (conflictService && conflictService.id !== id) {
          throw new ConflictException(
            `Service with name "${newName}" already exists for business ID "${newBusinessId}".`,
          );
        }
      }
    }

    try {
      const updatedService = await this.prisma.offeredService.update({
        where: { id },
        data: {
          ...data,
          name, // Si name es undefined, Prisma lo ignorará, si es string, lo usará.
          businessId, // Si businessId es undefined, Prisma lo ignorará.
        },
      });
      return OfferedServiceResponseDto.fromPrisma(updatedService);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `OfferedService with ID "${id}" not found.`,
        );
      }
      throw error;
    }
  }

  /**
   * Elimina un servicio ofrecido.
   * Considera si este servicio podría estar referenciado por reservas (`Booking`).
   * Podrías querer "desactivar" el servicio en lugar de eliminarlo.
   * @param id ID del servicio a eliminar.
   * @throws NotFoundException Si el servicio no se encuentra.
   * @throws ConflictException Si el servicio está en uso (ej. en una reserva).
   */
  async remove(id: string): Promise<void> {
    // Opcional: Implementar lógica para verificar si el servicio está en uso (ej. en Booking)
    const serviceInUse = await this.prisma.offeredService.findUnique({
      where: { id },
      include: {
        bookings: { take: 1 }, // Asumiendo que Booking tiene una relación con OfferedService
      },
    });

    if (serviceInUse && serviceInUse.bookings.length > 0) {
      throw new ConflictException(
        `OfferedService with ID "${id}" cannot be deleted because it is currently associated with existing bookings.`,
      );
    }

    try {
      await this.prisma.offeredService.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `OfferedService with ID "${id}" not found.`,
        );
      }
      throw error;
    }
  }
}
