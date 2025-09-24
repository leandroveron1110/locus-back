import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client'; // Para tipos de Prisma como JsonValue y WhereInput
import { PrismaService } from 'src/prisma/prisma.service';

// interface service
import { IBusinessService } from '../interfaces/business.interface';
import { IUserService } from 'src/users/interfaces/User-service.interface';
import { IStatusService } from 'src/status/interfaces/status-service.interface';

import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';
import {
  BusinessPreviewDto,
  BusinessProfileResponseDto,
  BusinessResponseDto,
} from '../dto/Response/business-response.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessCategoryService } from '../interfaces/business-category.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { IBusinessLogoService } from '../interfaces/business-logo-service.interface';
import {
  ModulesConfigSchema,
  ModulesConfig,
} from '../dto/Request/modules-config.schema.dto';
import { ISearchableBusinessCrudService } from 'src/search/interfaces/searchable-business-crud-service.interface';

@Injectable()
export class BusinessService implements IBusinessService {
  constructor(
    @Inject(TOKENS.ICategoryValidator)
    private categoryValidator: IExistenceValidator,
    @Inject(TOKENS.IStatusValidator) // Nuevo: Validador de existencia de estado
    private readonly statusValidator: IExistenceValidator,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,

    private prisma: PrismaService,
    @Inject(TOKENS.IUserService)
    private userService: IUserService,
    @Inject(TOKENS.IStatusService)
    private statusService: IStatusService,
    @Inject(TOKENS.IBusinessCategoryService)
    private businessCategoryService: IBusinessCategoryService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchableBusinessCrudService: ISearchableBusinessCrudService,
  ) {}

  async findOneProfileById(id: string): Promise<any> {
    const bussines = await this.findOne(id);
  }

  /**
   * create new bussines in database
   * El estado inicial, las categorías, tags e imágenes se manejan externamente o en el controlador.
   */

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
    });
  }

  async findAllPreview(): Promise<BusinessPreviewDto[]> {
    const businesses = await this.prisma.business.findMany();
    return businesses.map(BusinessPreviewDto.fromPrisma);
  }

  /**
   * Busca un único negocio por su ID.
   * Similar a findAll, solo devuelve la información core del negocio.
   */
  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id, isDeleted: false },
      include: {
        businessPaymentMethod: true,
      },
    });
    if (!business) {
      throw new NotFoundException(`Negocio con ID "${id}" no encontrado.`);
    }

    // const followNormalized = this.normalizeFollow(follow);

    return BusinessProfileResponseDto.fromPrismaWithRelations({
      business,
      logo: {
        url: business.logoUrl || '',
      },
    });
  }

  async findForOrder(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id, isDeleted: false },
      include: {
        businessPaymentMethod: true,
      },
    });
    if (!business) {
      throw new NotFoundException(`Negocio con ID "${id}" no encontrado.`);
    }

    // const followNormalized = this.normalizeFollow(follow);

    return business;
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

  async findByOwner(owenrId: string): Promise<any> {
    const business = await this.prisma.business.findMany({
      where: { ownerId: owenrId, isDeleted: false },
    });
    if (!business) {
      throw new NotFoundException(`Negocio con ID "${owenrId}" no encontrado.`);
    }

    // const followNormalized = this.normalizeFollow(follow);

    return business;
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

  async getModulesConfigByBusinessId(
    businessId: string,
  ): Promise<ModulesConfig> {
    const result = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        modulesConfig: true,
      },
    });
    if (!result) {
      throw new NotFoundException(
        `Negocio con ID "${businessId}" sin moduleConfig`,
      );
    }

    const parsed = ModulesConfigSchema.safeParse(result.modulesConfig);

    if (!parsed.success) {
      throw new BadRequestException(
        'La configuración de módulos del negocio es inválida',
      );
    }

    return parsed.data;
  }

  async findManyByIds(businessIds: string[]) {
    const businesses = await this.prisma.business.findMany({
      where: {
        id: {
          in: businessIds,
        },
      },
    });

    return businesses.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      description: b.shortDescription,
    }));
  }
}
