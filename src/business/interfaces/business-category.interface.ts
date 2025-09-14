import { BusinessCategory } from '@prisma/client'; // Importa el tipo de Prisma si es necesario para el retorno.
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';

export interface IBusinessCategoryService {
  /**
   * Asocia un negocio con una lista de IDs de categoría.
   * Este método gestiona la tabla intermedia BusinessCategory.
   * @param businessId El ID del negocio a asociar.
   * @param categoryIds Un array de IDs de categoría a asociar.
   * @returns Una promesa que resuelve cuando la operación ha sido completada.
   */
  associateBusinessWithCategories(
    businessId: string,
    categoryIds: string[],
  ): Promise<void>; // Retornar void para enfocarse solo en la acción de asociación.

  /**
   * Obtiene las categorías asociadas a un negocio específico.
   * @param businessId El ID del negocio.
   * @returns Una promesa que resuelve con un array de BusinessCategory (o una representación simplificada).
   */
  getCategoriesByBusinessId(businessId: string): Promise<BusinessTagResponseDto[]>; // O tu propia interfaz si no quieres depender de Prisma aquí.
}