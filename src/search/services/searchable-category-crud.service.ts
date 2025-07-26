// src/search/search-category.service.ts
import { PrismaService } from 'src/prisma/prisma.service';
import { ISearchableBusinessCrudService } from '../interfaces/searchable-business-crud-service.interface'; // Asegúrate de que la ruta sea correcta
import { Inject, NotFoundException, Injectable, Logger } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISearchableCategoryCrudService } from '../interfaces/searchable-category-crud-service.interface'; // Importa la interfaz definida

/**
 * Servicio para gestionar las categorías asociadas a un negocio searchable.
 */
@Injectable() // Asegúrate de que el servicio sea inyectable
export class SearchableCategoryService implements ISearchableCategoryCrudService {
  private readonly logger = new Logger(SearchableCategoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchBusiness: ISearchableBusinessCrudService,
  ) {}

  /**
   * Añade nuevas categorías a un negocio sin sobrescribir las existentes.
   * Primero verifica que el negocio exista, luego recupera las categorías actuales,
   * las combina con las nuevas (eliminando duplicados) y actualiza el registro.
   * @param idBusiness El ID del negocio al que se añadirán las categorías.
   * @param newCategories Un array de nombres de categorías a añadir.
   */
  async addCategoryToBusiness(
    idBusiness: string,
    newCategories: string[],
  ): Promise<void> {
    // 1. Verificar que el negocio exista
    await this.searchBusiness.checkOne(idBusiness);

    // 2. Obtener las categorías actuales del negocio
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { categoryNames: true }, // Selecciona solo el campo necesario
    });

    // Esta comprobación es redundante si `checkOne` ya se ejecutó y no lanzó un error,
    // pero puede ser una buena práctica defensiva si `checkOne` cambiara su comportamiento.
    if (!business) {
      this.logger.error(
        `Negocio con ID: ${idBusiness} no encontrado al intentar añadir categorías.`,
      );
      throw new NotFoundException(
        `Error: Business with ID: ${idBusiness} not found.`,
      );
    }

    // Obtener las categorías existentes, o un array vacío si no hay ninguna
    const currentCategories = business.categoryNames || [];

    // Combinar las categorías actuales con las nuevas, asegurando la unicidad
    const combinedCategoryNames = [
      ...new Set([...currentCategories, ...newCategories]),
    ];

    // 3. Actualizar el negocio con las categorías combinadas
    await this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { categoryNames: combinedCategoryNames },
    });
    this.logger.log(
      `Categorías [${newCategories.join(', ')}] añadidas al negocio ${idBusiness}.`,
    );
  }

  /**
   * Elimina categorías específicas de un negocio.
   * Primero verifica que el negocio exista, luego recupera las categorías actuales,
   * filtra las categorías a eliminar y actualiza el registro.
   * @param idBusiness El ID del negocio del que se eliminarán las categorías.
   * @param categoryNames Un array de nombres de categorías a eliminar.
   */
  async deleteCategoryToBusiness(
    idBusiness: string,
    categoryNames: string[],
  ): Promise<void> {
    // 1. Verificar que el negocio exista
    await this.searchBusiness.checkOne(idBusiness);

    // 2. Obtener las categorías actuales del negocio
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { categoryNames: true },
    });

    if (!business) {
      this.logger.error(
        `Negocio con ID: ${idBusiness} no encontrado al intentar eliminar categorías.`,
      );
      throw new NotFoundException(
        `Error: Business with ID: ${idBusiness} not found.`,
      );
    }

    // Obtener las categorías existentes, o un array vacío si no hay ninguna
    const currentCategories = business.categoryNames || [];

    // Filtrar las categorías que deben ser eliminadas
    const remainingCategories = currentCategories.filter(
      (category) => !categoryNames.includes(category),
    );

    // 3. Actualizar el negocio con las categorías restantes
    await this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { categoryNames: remainingCategories },
    });
    this.logger.log(
      `Categorías [${categoryNames.join(', ')}] eliminadas del negocio ${idBusiness}.`,
    );
  }

  /**
   * Establece (reemplaza completamente) todas las categorías para un negocio con un nuevo array de categorías.
   * Primero verifica que el negocio exista, luego actualiza el campo `categoryNames` con el nuevo array.
   * @param idBusiness El ID del negocio.
   * @param categories Un array de nombres de categorías a establecer.
   */
  async setCategoriesForBusiness(
    idBusiness: string,
    categories: string[],
  ): Promise<void> {
    // 1. Verificar que el negocio exista
    await this.searchBusiness.checkOne(idBusiness);

    // 2. Actualizar el negocio con el nuevo array de categorías
    await this.prisma.searchableBusiness.update({
      where: { id: idBusiness },
      data: { categoryNames: categories },
    });
    this.logger.log(
      `Categorías para el negocio ${idBusiness} establecidas a: [${categories.join(', ')}].`,
    );
  }

  /**
   * Recupera todas las categorías asociadas con un negocio específico.
   * @param idBusiness El ID del negocio.
   * @returns Una promesa que resuelve a un array de nombres de categorías.
   */
  async getCategoriesForBusiness(idBusiness: string): Promise<string[]> {
    await this.searchBusiness.checkOne(idBusiness); // Asegura que el negocio exista
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { categoryNames: true },
    });
    return business?.categoryNames || [];
  }
}
