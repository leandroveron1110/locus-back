import { BusinessTag } from '@prisma/client';
import { BusinessTagDetails } from '../services/business-tag.service';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';

// src/business/interfaces/business-tag.interface.ts
export interface IBusinessTagService {
  /**
   * Asocia un negocio con una lista de IDs de tags.
   * Este método gestiona la tabla intermedia BusinessTag.
   * Si un tag no existe o un negocio no existe, debería manejarlo internamente
   * (ej. lanzando una excepción si es un error de negocio).
   * @param businessId El ID del negocio a asociar.
   * @param tagIds Un array de IDs de tags a asociar.
   * @returns Una promesa que resuelve cuando la operación ha sido completada.
   */
  associateBusinessWithTags(
    businessId: string,
    tagIds: string[],
  ): Promise<void>;

  /**
   * Obtiene los tags asociados a un negocio específico.
   * @param businessId El ID del negocio.
   * @returns Una promesa que resuelve con un array de objetos BusinessTag.
   * Puedes ajustar el tipo de retorno si necesitas un DTO más específico
   * que la entidad cruda de Prisma, especialmente pensando en el microservicio.
   */
  getTagsByBusinessId(businessId: string): Promise<BusinessTagResponseDto[]>;
}
