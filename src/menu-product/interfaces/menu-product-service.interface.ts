// src/menu/interfaces/menu-product-service.interface.ts

import { MenuProduct } from '@prisma/client';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';

export interface IMenuProductService {
  create(
    seccionId: string,
    menuId: string,
    ownerId: string,
    businessId: string,
    dto: CreateMenuProductDto,
  ): Promise<MenuProduct>;

  findAll(): Promise<MenuProduct[]>;

  findAllBySeccion(seccionId: string): Promise<MenuProduct[]>;

  findOne(id: string): Promise<MenuProduct>;

  update(id: string, dto: Partial<CreateMenuProductDto>): Promise<MenuProduct>;

  remove(id: string): Promise<MenuProduct>;
}
