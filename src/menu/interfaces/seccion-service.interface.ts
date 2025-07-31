import { Seccion } from '@prisma/client';
import { SeccionCreateDto, SeccionUpdateDto } from '../dtos/request/seccion.request.dto';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

export interface ISeccionService {
  createSeccion(dto: SeccionCreateDto): Promise<Seccion>;
  findAllByMenuId(menuId: string): Promise<Seccion[]>;
  findOne(id: string): Promise<Seccion>;
  updateSeccion(id: string, dto: SeccionUpdateDto): Promise<Seccion>;
  deleteSeccion(id: string): Promise<Seccion>;
}

export interface ISeccionValidator extends IExistenceValidator {
  existSeccionAndMenuAndOwnerAndBusiness(
    seccionId: string,
    manuId: string,
    ownerId: string,
    businessId: string,
  ): Promise<void>;
}