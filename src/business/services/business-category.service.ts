// src/business/services/business-category.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta a tu PrismaService
import { IBusinessCategoryService } from '../interfaces/business-category.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { ICategoryService } from 'src/categories/interfaces/Category.interface';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';
import { ISearchableCategoryCrudService } from 'src/search/interfaces/searchable-category-crud-service.interface';

@Injectable()
export class BusinessCategoryService implements IBusinessCategoryService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    @Inject(TOKENS.ICategoryValidator)
    private categoryValidator: IExistenceValidator,
    @Inject(TOKENS.ICategoryService)
    private categoryService: ICategoryService,
    @Inject(TOKENS.ISearchCategoryCrudService)
    private searchableCategoryCrudService: ISearchableCategoryCrudService,
  ) {}

  async associateBusinessWithCategories(
    businessId: string,
    categoryIds: string[],
  ): Promise<void> {
    // 1. Validar si el negocio existe.
    // Esta llamada es necesaria y difícil de optimizar, pero es crucial.
    await this.businessValidator.checkOne(businessId);

    // 2. Unificar la validación de categorías y la obtención de nombres en una sola llamada.
    // Esto reduce una llamada a la base de datos.
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    if (categories.length !== categoryIds.length) {
      // Opcional: Identificar qué IDs de categorías no existen para un mensaje de error más claro.
      const foundIds = new Set(categories.map((c) => c.id));
      const missingIds = categoryIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Una o más categorías no fueron encontradas: ${missingIds.join(', ')}`,
      );
    }

    const categoryNames = categories.map((c) => c.name);

    // 3. Usar una transacción para `deleteMany` y `createMany` en la base de datos principal.
    // Esto asegura que ambas operaciones se ejecuten como una sola unidad atómica.
    const createManyData = categoryIds.map((categoryId) => ({
      businessId: businessId,
      categoryId: categoryId,
    }));

    await this.prisma.$transaction([
      this.prisma.businessCategory.deleteMany({
        where: { businessId: businessId },
      }),
      this.prisma.businessCategory.createMany({
        data: createManyData,
        skipDuplicates: true,
      }),
    ]);

    // 4. Sincronizar con el buscador.
    // Esta llamada sigue siendo necesaria para mantener la consistencia.
    // Aquí el `setCategoriesForBusiness` es el método correcto y más eficiente.
    await this.searchableCategoryCrudService.setCategoriesForBusiness(
      businessId,
      categoryNames,
    );
  }

  async getCategoriesByBusinessId(
    businessId: string,
  ): Promise<BusinessTagResponseDto[]> {
    const businessCategoryAssociations =
      await this.prisma.businessCategory.findMany({
        where: { businessId: businessId },
        select: {
          businessId: true,
          categoryId: true,
          assignedAt: true,
        },
      });

    if (businessCategoryAssociations.length === 0) {
      return [];
    }

    const categoryIds = businessCategoryAssociations.map(
      (assoc) => assoc.categoryId,
    );
    const uniqueCategoryIds = [...new Set(categoryIds)];

    // Usar el tagService para obtener los detalles completos de los tags
    const tagsDetails =
      await this.categoryService.getCategoryByIds(uniqueCategoryIds);

    return BusinessTagResponseDto.fromPrismaTags(tagsDetails);
  }
}
