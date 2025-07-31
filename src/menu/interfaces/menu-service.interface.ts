import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { MenuCreateDto, MenuUpdateDto } from '../dtos/request/menu.request.dto';
import { Menu } from '@prisma/client';

export interface IMenuService {
  createMenu(dto: MenuCreateDto): Promise<Menu>;
  findAllByBusinessId(businessId: string): Promise<Menu[]>;
  findOne(id: string): Promise<Menu>;
  updateMenu(id: string, dto: MenuUpdateDto): Promise<Menu>;
  deleteMenu(id: string): Promise<Menu>;
}

export interface IMenuValidator extends IExistenceValidator {
  existMenuAndOwnerAndBusiness(
    manuId: string,
    ownerId: string,
    businessId: string,
  ): Promise<void>;
}
