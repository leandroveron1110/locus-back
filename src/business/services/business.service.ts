import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client'; // Para tipos de Prisma como JsonValue y WhereInput
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';
import { UsersService } from 'src/users/services/users.service';
import { CategoryService } from 'src/categories/services/categories.service';
import { StatusService } from 'src/status/services/status.service';
import { BusinessPreviewDto, BusinessResponseDto } from '../dto/Response/business-response.dto';
import { EntityType } from 'src/common/enums/entity-type.enum';
import { IBusinessService } from '../interfaces/business.interface';

@Injectable()
export class BusinessService implements IBusinessService {
  constructor(
    private prisma: PrismaService,
    private userService: UsersService,
    private categoryService: CategoryService,
    private statusService: StatusService,
  ) {}

  /**
   * Crea un nuevo negocio en la base de datos.
   * El estado inicial, las categorías, tags e imágenes se manejan externamente o en el controlador.
   */
  async create(
    createBusinessDto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    const { ownerId, categoryId, statusId, modulesConfig, ...data } =
      createBusinessDto;

    // 1. Validar existencia del propietario (User)
    // El método findOne de UserService debería lanzar NotFoundException si no lo encuentra
    await this.userService.findById(ownerId); // Usar findOne del servicio inyectado

    // 2. Validar existencia de la categoría
    await this.categoryService.findOne(categoryId); // Usar findOne del servicio inyectado

    // 3. Validar existencia del estado si se proporciona
    let currentStatus;
    if (statusId) {
      currentStatus = await this.statusService.findByNameAndEntityType(
        statusId,
        EntityType.BUSINESS,
      ); // Asumiendo que findByNameAndEntityType existe
    }
    // Si no se proporciona statusId, Prisma usará el default del esquema si lo hay, o será null.

    try {
      // 4. Crear el negocio, conectando las relaciones por ID
      const business = await this.prisma.business.create({
        data: {
          ...data,
          owner: { connect: { id: ownerId } },
          category: { connect: { id: categoryId } },
          // Conectar status si está presente, de lo contrario, será null o usará el default de Prisma
          currentStatus: statusId
            ? { connect: { id: currentStatus.id } }
            : undefined,
          modulesConfig: (modulesConfig || {}) as Prisma.InputJsonValue, // Asegura que modulesConfig sea un objeto vacío si es null/undefined
        },
      });

      // 5. Transformar el resultado de Prisma a tu DTO de respuesta
      return BusinessResponseDto.fromPrisma(business);
    } catch (error) {
      // Manejo específico de errores de Prisma (ej. si la unicidad falla en 'name' y 'address')
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint violation (ej. si name y address son @@unique y ya existen)
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A business with the same name and address already exists.',
          );
        }
        // P2003: Foreign key constraint failed (menos probable si ya validamos con findOne,
        // pero es una buena salvaguarda si las validaciones previas fallan silenciosamente o hay condiciones de carrera)
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'Invalid owner or category ID. Please ensure they exist.',
          );
        }
      }
      throw error; // Propagar cualquier otro error
    }
  }

  /**
   * Obtiene una lista de negocios. Las relaciones como tags, images, etc., NO se incluyen.
   * Si se necesitan, el consumidor debe hacer llamadas adicionales a los servicios correspondientes.
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BusinessWhereUniqueInput;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.business.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      // Solo incluimos relaciones que son CORE para el Negocio y no son opcionales/modulares
      // o que son esenciales para un lookup mínimo (como la categoría asociada al ID).
      // NO INCLUIMOS: owner, tags, images, currentStatus, weeklySchedules, etc.
      include: {
        category: true, // La categoría es parte del perfil base del negocio
      },
    });
  }

  async findAllPreview(): Promise<BusinessPreviewDto[]> {
  const businesses = await this.prisma.business.findMany({
    include: {
      category: true,
    },
  });
  return businesses.map(BusinessPreviewDto.fromPrisma);
}

  /**
   * Busca un único negocio por su ID.
   * Similar a findAll, solo devuelve la información core del negocio.
   */
  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        category: true, // La categoría es parte del perfil base del negocio
      },
    });
    if (!business) {
      throw new NotFoundException(`Negocio con ID "${id}" no encontrado.`);
    }
    return business;
  }

  /**
   * Actualiza la información core de un negocio existente.
   * La actualización de tags, imágenes, estado o propietario se maneja en otros servicios.
   */
  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const { modulesConfig, ...rest } = updateBusinessDto;

    const dataToUpdate: Prisma.BusinessUpdateInput = {
      ...rest,
      ...(modulesConfig !== undefined && {
        modulesConfig: modulesConfig as Prisma.InputJsonValue,
      }),
    };
    try {
      const updatedBusiness = await this.prisma.business.update({
        where: { id },
        data: dataToUpdate,
        include: {
          category: true, // Se incluye para la respuesta
        },
      });
      return updatedBusiness;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `No se pudo actualizar el negocio con ID "${id}".`,
          );
        }
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new NotFoundException(
            'ID de categoría o propietario no válido para la actualización.',
          );
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un negocio del core. Las entidades relacionadas (imágenes, tags, etc.)
   * deben ser gestionadas por sus respectivos servicios (si no hay onDelete: Cascade).
   */
  async remove(id: string) {
    try {
      // Si tienes onDelete: Cascade en tu schema para Image, Prisma las eliminará.
      // Para otras relaciones (ej. tags, status), sus servicios respectivos
      // deberían gestionar la limpieza o el desenlace de la relación.
      return await this.prisma.business.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Negocio con ID "${id}" no encontrado para eliminar.`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Actualiza la configuración de módulos opcionales para un negocio.
   * Esto SÍ es parte del core del negocio.
   */
  async updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ) {
    try {
      return await this.prisma.business.update({
        where: { id: businessId },
        data: {
          modulesConfig: modulesConfig as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          modulesConfig: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Negocio con ID "${businessId}" no encontrado para actualizar la configuración de módulos.`,
          );
        }
      }
      throw error;
    }
  }
}
