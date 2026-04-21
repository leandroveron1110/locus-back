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
import { id } from 'zod/v4/locales';

@Injectable()
export class BusinessCommandService implements IBusinessCommandService {
  constructor(
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IUserService)
    private readonly userService: IUserService,
    @Inject(TOKENS.IBusinessCategoryService)
    private readonly businessCategoryService: IBusinessCategoryService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchableBusinessCrudService: ISearchableBusinessCrudService,
  ) {}
  updateBusiness(id: string, dto: UpdateBusinessDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * Formatea un texto a Title Case (Primeras letras en mayúscula)
   */
  private toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async create(
    createBusinessDto: CreateBusinessDto,
  ): Promise<BusinessResponseDto | undefined> {
    const { ownerId, modulesConfig, latitude, longitude, address, ...data } =
      createBusinessDto;

    // Validar usuario
    const user = await this.userService.findById(ownerId);
    if (!user) {
      throw new ForbiddenException(
        `El usuario con ID "${ownerId}" no existe o no es válido.`,
      );
    }

    const formattedAddress = this.toTitleCase(address);
    const formattedName = this.toTitleCase(data.name);

    return this.prisma.$transaction(async (tx) => {
      try {
        // 1. Crear Negocio
        const business = await tx.business.create({
          data: {
            ...data,
            name: formattedName,
            address: formattedAddress,
            owner: { connect: { id: ownerId } },
            modulesConfig: (modulesConfig || {}) as Prisma.InputJsonValue,
            latitude: latitude != null ? new Prisma.Decimal(latitude) : null,
            longitude: longitude != null ? new Prisma.Decimal(longitude) : null,
          },
        });

        // 2. Crear Dirección relacionada
        if (latitude != null && longitude != null) {
          await tx.address.create({
            data: {
              street: formattedAddress,
              city: 'Concepción del Uruguay',
              province: 'Entre Ríos',
              enabled: true,
              latitude: new Prisma.Decimal(latitude),
              longitude: new Prisma.Decimal(longitude),
              businessId: business.id,
            },
          });
        }

        // 3. Sincronizar con Motor de Búsqueda
        await this.searchableBusinessCrudService.create({
          id: business.id,
          name: business.name,
          address: business.address,
          city: 'Concepción del Uruguay',
          province: 'Entre Ríos',
          latitude: Number(business.latitude),
          longitude: Number(business.longitude),
          logoUrl: business.logoUrl || undefined,
          shortDescription: business.shortDescription || '',
          fullDescription: business.fullDescription || '',
          followersCount: 0,
        });

        return BusinessResponseDto.fromPrisma(business);
      } catch (error) {
        this.handlePrismaError(error, data.name);
      }
    });
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto) {
    const { modulesConfig, latitude, longitude, ...rest } = updateBusinessDto;

    await this.businessValidator.checkOne(id);

    const formattedData = {
      ...rest,
      ...(rest.name && { name: this.toTitleCase(rest.name) }),
      ...(rest.address && { address: this.toTitleCase(rest.address) }),
      ...(modulesConfig !== undefined && {
        modulesConfig: modulesConfig as Prisma.InputJsonValue,
      }),
      ...(latitude != null && { latitude: new Prisma.Decimal(latitude) }),
      ...(longitude != null && { longitude: new Prisma.Decimal(longitude) }),
    };

    return this.prisma.$transaction(async (tx) => {
      try {
        // 1. Actualizar el negocio
        const updatedBusiness = await tx.business.update({
          where: { id, isDeleted: false },
          data: formattedData,
        });

        // 2. Sincronizar o Crear la dirección física
        if (latitude != null || longitude != null) {
          const existingAddress = await tx.address.findFirst({
            where: { businessId: id },
          });

          const addressPayload = {
            latitude: latitude != null ? new Prisma.Decimal(latitude) : null,
            longitude: longitude != null ? new Prisma.Decimal(longitude) : null,
            street: this.toTitleCase(
              rest.address || updatedBusiness.address || '',
            ),
            city: 'Concepción del Uruguay', // Opcional: podrías sacarlo del DTO si existiera
            province: 'Entre Ríos',
            enabled: true,
          };

          if (existingAddress) {
            // Si existe, actualizamos
            await tx.address.update({
              where: { id: existingAddress.id },
              data: addressPayload,
            });
          } else {
            // Si NO existe, creamos la nueva dirección vinculada al negocio
            await tx.address.create({
              data: {
                ...addressPayload,
                businessId: id,
              },
            });
          }
        }

        // 3. Sincronizar Motor de Búsqueda
        await this.searchableBusinessCrudService.update({
          id,
          name: updatedBusiness.name,
          address: updatedBusiness.address || undefined,
          shortDescription: updatedBusiness.shortDescription || undefined,
          fullDescription: updatedBusiness.fullDescription || undefined,
          latitude: updatedBusiness.latitude
            ? Number(updatedBusiness.latitude)
            : undefined,
          longitude: updatedBusiness.longitude
            ? Number(updatedBusiness.longitude)
            : undefined,
        });

        const categories =
          await this.businessCategoryService.getCategoriesByBusinessId(id);
        return { ...updatedBusiness, businessCategories: categories };
      } catch (error) {
        this.handlePrismaError(error, rest.name);
      }
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.business.update({
        where: { id },
        data: { isDeleted: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateModulesConfig(
    businessId: string,
    modulesConfig: Prisma.JsonValue,
  ): Promise<{ id: string; modulesConfig: Prisma.JsonValue } | undefined> {
    const result = ModulesConfigSchema.safeParse(modulesConfig);
    if (!result.success)
      throw new BadRequestException('Configuración de módulos inválida');

    try {
      const res = await this.prisma.business.update({
        where: { id: businessId, isDeleted: false },
        data: { modulesConfig: result.data },
        select: { id: true, modulesConfig: true },
      });

      return {
        id: businessId,
        modulesConfig: res.modulesConfig as Prisma.JsonValue,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Centralizador de errores de Prisma
   */
  private handlePrismaError(error: any, name?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe un recurso con el nombre "${name}".`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Recurso no encontrado.`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Error de integridad: Algún ID proporcionado no existe.',
        );
      }
    }
    throw error;
  }
}
