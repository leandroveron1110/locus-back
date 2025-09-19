// src/business/services/business-tag.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IBusinessTagService } from '../interfaces/business-tag.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { Tag as PrismaTag } from '@prisma/client'; // Importamos el tipo Tag de Prisma para el DTO de retorno
import { ITagService } from 'src/targs/interfaces/tag-service.interface';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';
import { ISearchableTagCrudService } from 'src/search/interfaces/searchable-tag-crud-service.interface';

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
    @Inject(TOKENS.ISearchableTagCrudService)
    private readonly searchableTagCrudService: ISearchableTagCrudService,
    @Inject(TOKENS.ITagService)
    private readonly tagService: ITagService,
  ) {}

// src/business/business-tag.service.ts (o donde se encuentre)

// Asume que tienes un TagService para obtener los nombres de los tags
// y un SearchableTagCrudService inyectado.

async associateBusinessWithTags(
  businessId: string,
  tagIds: string[],
): Promise<void> {
  // 1. Validar si el negocio existe.
  await this.businessValidator.checkOne(businessId);

  // 2. Unificar la validación de tags y la obtención de nombres en una sola llamada.
  const tags = await this.prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true },
  });

  if (tags.length !== tagIds.length) {
    const foundIds = new Set(tags.map((t) => t.id));
    const missingIds = tagIds.filter((id) => !foundIds.has(id));
    throw new NotFoundException(
      `Uno o más tags no fueron encontrados: ${missingIds.join(', ')}`,
    );
  }

  const tagNames = tags.map((t) => t.name);

  // 3. Usar una transacción para `deleteMany` y `createMany` en la base de datos principal.
  const createManyData = tagIds.map((tagId) => ({
    businessId: businessId,
    tagId: tagId,
  }));

  await this.prisma.$transaction([
    this.prisma.businessTag.deleteMany({
      where: { businessId: businessId },
    }),
    this.prisma.businessTag.createMany({
      data: createManyData,
      skipDuplicates: true,
    }),
  ]);

  // 4. Sincronizar con el buscador.
  // Es crucial usar `setTagsForBusiness` para reemplazar los tags existentes.
  await this.searchableTagCrudService.setTagsForBusiness(
    businessId,
    tagNames,
  );
}

  async getTagsByBusinessId(
    businessId: string,
  ): Promise<BusinessTagResponseDto[]> {
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

    return BusinessTagResponseDto.fromPrismaTags(tagsDetails);
  }
}
