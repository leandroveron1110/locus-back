// src/business/services/business-tag.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBusinessTagService } from '../interfaces/business-tag.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { Tag as PrismaTag } from '@prisma/client'; // Importamos el tipo Tag de Prisma para el DTO de retorno
import { ITagService } from 'src/targs/interfaces/tag-service.interface';

// Definir el DTO de retorno para getTagsByBusinessId
export interface BusinessTagDetails {
  businessId: string;
  tagId: string;
  assignedAt: Date;
  tag: {
    id: string;
    name: string;
    description?: string; // Asegúrate de que este campo exista en tu modelo Tag si lo esperas aquí
    active: boolean; // También puedes incluir el estado activo
  };
}

@Injectable()
export class BusinessTagService implements IBusinessTagService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    @Inject(TOKENS.ITagValidator)
    private readonly tagValidator: IExistenceValidator,
    @Inject(TOKENS.ITagService)
    private readonly tagService: ITagService,
  ) {}

  async associateBusinessWithTags(
    businessId: string,
    tagIds: string[],
  ): Promise<void> {
    await this.businessValidator.checkOne(businessId);

    if (tagIds && tagIds.length > 0) {
      await this.tagValidator.checkMany(tagIds);
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.businessTag.deleteMany({
        where: { businessId: businessId },
      });

      if (tagIds && tagIds.length > 0) {
        const createManyData = tagIds.map((tagId) => ({
          businessId: businessId,
          tagId: tagId,
        }));
        await prisma.businessTag.createMany({
          data: createManyData,
          skipDuplicates: true,
        });
      }
    });
  }

  async getTagsByBusinessId(businessId: string): Promise<BusinessTagDetails[]> {
    // Opcional: Validar existencia del negocio si esta es la primera llamada
    // await this.businessValidator.checkOne(businessId);

    const businessTagAssociations = await this.prisma.businessTag.findMany({
      where: { businessId: businessId },
      select: {
        businessId: true,
        tagId: true,
        assignedAt: true,
      },
    });

    if (businessTagAssociations.length === 0) {
      return [];
    }

    const tagIds = businessTagAssociations.map((assoc) => assoc.tagId);
    const uniqueTagIds = [...new Set(tagIds)];

    // Usar el tagService para obtener los detalles completos de los tags
    const tagsDetails = await this.tagService.getTagsByIds(uniqueTagIds);

    const tagsMap = new Map<string, PrismaTag>(
      tagsDetails.map((tag) => [tag.id, tag]),
    );

    const result: BusinessTagDetails[] = businessTagAssociations
      .map((assoc) => {
        const tag = tagsMap.get(assoc.tagId);
        if (!tag) {
          console.warn(
            `Tag con ID ${assoc.tagId} asociado al negocio ${assoc.businessId} no encontrado en TagService.`,
          );
          return null;
        }
        return {
          businessId: assoc.businessId,
          tagId: assoc.tagId,
          assignedAt: assoc.assignedAt,
          tag: {
            id: tag.id,
            name: tag.name,
            active: tag.active, // Agregado el estado activo
          },
        };
      })
      .filter(Boolean) as BusinessTagDetails[];

    return result;
  }
}
