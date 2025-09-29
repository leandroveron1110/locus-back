import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { MenuCreateDto, MenuUpdateDto } from '../dtos/request/menu.request.dto';
import { Menu } from '@prisma/client';
import { MenuWithSectionsDto } from '../dtos/response/menu-res.dto';

export interface IMenuService {
  createMenu(dto: MenuCreateDto): Promise<Menu>;
  findAllByBusinessId(businessId: string): Promise<MenuWithSectionsDto[]>;
  findAllByBusinessIdForBusiness(businessId: string): Promise<MenuWithSectionsDto[]>
  findAll(): Promise<any>;
  findOne(id: string): Promise<Menu>;
  updateMenu(id: string, dto: MenuUpdateDto): Promise<Menu>;
  deleteMenu(id: string): Promise<Menu>;
  findBusinessesWithDiscountedProducts(): Promise<any>;
}

export interface IMenuValidator extends IExistenceValidator {
  existMenuAndOwnerAndBusiness(
    manuId: string,
    ownerId: string,
    businessId: string,
  ): Promise<void>;
}
