// src/business/services/business-category.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta a tu PrismaService
import { IBusinessCategoryService } from '../interfaces/business-category.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { ICategoryService } from 'src/categories/interfaces/Category.interface';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';

@Injectable()
export class BusinessCategoryService implements IBusinessCategoryService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    @Inject(TOKENS.ICategoryValidator)
    private categoryValidator: IExistenceValidator,
    @Inject(TOKENS.ICategoryService)
    private categoryService: ICategoryService
  ) {}

  async associateBusinessWithCategories(
    businessId: string,
    categoryIds: string[],
  ): Promise<void> {
    await this.businessValidator.checkOne(businessId);

    // 2. Verificar que todas las categorías existan
    if (categoryIds && categoryIds.length > 0) {
      await this.categoryValidator.checkMany(categoryIds);
    }

    // Eliminar todas las asociaciones de categorías existentes para este negocio
    await this.prisma.businessCategory.deleteMany({
      where: { businessId: businessId },
    });

    // Crear las nuevas asociaciones si hay categoryIds
    if (categoryIds && categoryIds.length > 0) {
      const createManyData = categoryIds.map((categoryId) => ({
        businessId: businessId,
        categoryId: categoryId,
      }));
      await this.prisma.businessCategory.createMany({
        data: createManyData,
        skipDuplicates: true,
      });
    }
  }

  async getCategoriesByBusinessId(businessId: string): Promise<BusinessTagResponseDto[]> {
     const businessCategoryAssociations = await this.prisma.businessCategory.findMany({
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
    
        const categoryIds = businessCategoryAssociations.map((assoc) => assoc.categoryId);
        const uniqueCategoryIds = [...new Set(categoryIds)];
    
        // Usar el tagService para obtener los detalles completos de los tags
        const tagsDetails = await this.categoryService.getCategoryByIds(uniqueCategoryIds);
    
        return BusinessTagResponseDto.fromPrismaTags(tagsDetails);
  }
}
