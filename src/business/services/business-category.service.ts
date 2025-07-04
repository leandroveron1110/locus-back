// src/business/services/business-category.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta a tu PrismaService
import { IBusinessCategoryService } from '../interfaces/business-category.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class BusinessCategoryService implements IBusinessCategoryService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    @Inject(TOKENS.ICategoryValidator)
    private categoryValidator: IExistenceValidator,
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

  async getCategoriesByBusinessId(businessId: string) {
    // Aquí no necesitamos verificar la existencia del negocio si el controlador o
    // el BusinessService ya lo hizo antes de llamar a este método.
    // Si este método fuera llamado directamente, podríamos considerar añadir la verificación.
    return this.prisma.businessCategory.findMany({
      where: { businessId: businessId },
      include: {
        category: true, // Incluye los detalles completos de la categoría
      },
    });
  }
}
