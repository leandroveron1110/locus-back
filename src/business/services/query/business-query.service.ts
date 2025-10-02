import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ModulesConfigSchema,
  ModulesConfig,
} from 'src/business/dto/Request/modules-config.schema.dto';
import { BusinessOgResponseDto } from 'src/business/dto/Response/Business-og-response.dto';
import {
  BusinessPreviewDto,
  BusinessProfileResponseDto,
} from 'src/business/dto/Response/business-response.dto';
import { IBusinessQueryService } from 'src/business/interfaces/business.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessQueryService implements IBusinessQueryService {
  constructor(private prisma: PrismaService) {}

  findOneProfileById(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

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
    return business;
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

  async findOgData(businessId: string): Promise<BusinessOgResponseDto | null> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        shortDescription: true,
        logoUrl: true,
      },
    });

    if (!business) {
      throw new NotFoundException(
        `Negocio con ID "${businessId}" no encontrado`,
      );
    }

    return {
      name: business.name,
      description: business.shortDescription,
      imageUrl: business.logoUrl ? business.logoUrl :  null, // imageUrl será 'string' o 'null'
    } as BusinessOgResponseDto;
  }
  // ...
}
