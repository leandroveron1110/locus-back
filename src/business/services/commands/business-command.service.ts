import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateBusinessDto } from 'src/business/dto/Request/create-business.dto';
import { ModulesConfigSchema } from 'src/business/dto/Request/modules-config.schema.dto';
import { UpdateBusinessDto } from 'src/business/dto/Request/update-business.dto';
import { BusinessResponseDto } from 'src/business/dto/Response/business-response.dto';
import { IBusinessCategoryService } from 'src/business/interfaces/business-category.interface';
import { IBusinessCommandService } from 'src/business/interfaces/business.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ISearchableBusinessCrudService } from 'src/search/interfaces/searchable-business-crud-service.interface';
import { IUserService } from 'src/users/interfaces/User-service.interface';

@Injectable()
export class BusinessCommandService implements IBusinessCommandService{
  constructor(
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,

    private prisma: PrismaService,
    @Inject(TOKENS.IUserService)
    private userService: IUserService,
    @Inject(TOKENS.IBusinessCategoryService)
    private businessCategoryService: IBusinessCategoryService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchableBusinessCrudService: ISearchableBusinessCrudService,
  ) {}

  async create(
    createBusinessDto: CreateBusinessDto,
    // authenticatedOwnerId: string
  ): Promise<BusinessResponseDto> {
    const { ownerId, modulesConfig, latitude, longitude, ...data } =
      createBusinessDto;

    // 1. Validar que el `ownerId` de la request sea el mismo que el `authenticatedOwnerId`
    // if (ownerId !== authenticatedOwnerId) {
    //   throw new ForbiddenException('No tienes permiso para crear un negocio para otro propietario.');
    // }

    const user = await this.userService.findById(ownerId);
    if (!user) {
      throw new ForbiddenException(
        `El usuario con ID "${ownerId}" no tiene el rol de PROPIETARIO para crear un negocio.`,
      );
    }

    try {
      const business = await this.prisma.business.create({
        data: {
          ...data,
          owner: { connect: { id: ownerId } },
          modulesConfig: (modulesConfig || {}) as Prisma.InputJsonValue, // Asegura un objeto JSON vacío si es null/undefined
          // Convertir number (del DTO) a Prisma.Decimal para la base de datos
          latitude:
            latitude !== undefined ? new Prisma.Decimal(latitude) : null,
          longitude:
            longitude !== undefined ? new Prisma.Decimal(longitude) : null,
        },
      });

      await this.searchableBusinessCrudService.create({
        followersCount: 0,
        id: business.id,
        name: business.name,
        address: business.address,
        city: 'Concepcion del Uruguay',
        fullDescription: business.fullDescription || '',
        latitude: Number(business.latitude),
        longitude: Number(business.longitude),
        logoUrl: business.logoUrl || undefined,
        modulesConfig: business.modulesConfig
          ? JSON.stringify(business.modulesConfig)
          : undefined,
        shortDescription: business.shortDescription || '',
        province: 'Entre rios',
      });

      // Si necesitas transformar el resultado a un DTO de respuesta específico
      // Asegúrate de que BusinessResponseDto pueda manejar la carga de relaciones si es necesario
      return BusinessResponseDto.fromPrisma(business); // O BusinessResponseDto.fromPrisma(business);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Ya existe un negocio con el nombre "${createBusinessDto.name}".`,
          );
        }
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new BadRequestException(
            'ID de propietario, logo o categoría inválido. Verifique que existan.',
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const { modulesConfig, ...rest } = updateBusinessDto;

    const dataToUpdate: Prisma.BusinessUpdateInput = {
      ...rest,
      ...(modulesConfig !== undefined && {
        modulesConfig: modulesConfig as Prisma.InputJsonValue,
      }),
    };

    try {
      // 1️⃣ Actualizamos la entidad principal
      const updatedBusiness = await this.prisma.business.update({
        where: { id, isDeleted: false },
        data: dataToUpdate,
      });

      // 2️⃣ Sincronizamos searchableBusiness en paralelo, no bloqueamos el return
      await Promise.all([
        this.searchableBusinessCrudService.update({
          id,
          name: updatedBusiness.name,
          shortDescription: updatedBusiness.shortDescription || undefined,
          fullDescription: updatedBusiness.fullDescription || undefined,
          address: updatedBusiness.address || undefined,
          latitude:
            updatedBusiness.latitude !== null &&
            updatedBusiness.latitude !== undefined
              ? Number(updatedBusiness.latitude)
              : undefined,
          longitude:
            updatedBusiness.longitude !== null &&
            updatedBusiness.longitude !== undefined
              ? Number(updatedBusiness.longitude)
              : undefined,
        }),
      ]);

      return updatedBusiness;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `No se pudo actualizar el negocio con ID "${id}".`,
          );
        }
        if (error.code === 'P2003') {
          throw new NotFoundException(
            'ID de categoría o propietario no válido para la actualización.',
          );
        }
      }
      throw error;
    }
  }

  async updateBusiness(id: string, data: UpdateBusinessDto) {
    const { ownerId, modulesConfig, ...businessData } = data;

    await this.businessValidator.checkOne(id);

    const dataToUpdate: Prisma.BusinessUpdateInput = {
      ...businessData,
      ...(modulesConfig !== undefined && {
        modulesConfig: modulesConfig as Prisma.InputJsonValue,
      }),
    };

    return this.prisma.$transaction(async (prismaTransaction) => {
      const business = await prismaTransaction.business.update({
        where: { id, isDeleted: false },
        data: {
          ...dataToUpdate,
        },
      });

      if (!business) {
        throw new NotFoundException(`Negocio con ID "${id}" no encontrado.`);
      }

      // Después de la actualización, si necesitas los detalles de las categorías para la respuesta
      const associatedCategories =
        await this.businessCategoryService.getCategoriesByBusinessId(id);

      return {
        ...business,
        businessCategories: associatedCategories,
      };
    });
  }

  /**
   * Elimina un negocio del core. Las entidades relacionadas (imágenes, tags, etc.)
   * deben ser gestionadas por sus respectivos servicios (si no hay onDelete: Cascade).
   */
  async remove(id: string) {
    try {
      return await this.prisma.business.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });
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

  async updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ) {
    try {
      // ✅ Validamos el config con Zod
      const result = ModulesConfigSchema.safeParse(modulesConfig);

      if (!result.success) {
        throw new BadRequestException('modulesConfig inválido');
      }

      return this.prisma.business.update({
        where: { id: businessId, isDeleted: false },
        data: { modulesConfig: result.data },
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
