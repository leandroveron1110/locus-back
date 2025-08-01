// src/menu/interfaces/menu-product-service.interface.ts

import { MenuProduct } from '@prisma/client';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { MenuProductDto } from '../dtos/response/menu-product-response.dto';

export interface IMenuProductService {
  create(
    dto: CreateMenuProductDto,
  ): Promise<MenuProduct>;

  findAll(): Promise<MenuProduct[]>;

  findAllBySeccion(seccionId: string): Promise<MenuProduct[]>;

  findAllBySeccionIds(seccionIds: string[]): Promise<MenuProductDto[]>

  findOne(id: string): Promise<MenuProduct>;

  update(id: string, dto: Partial<CreateMenuProductDto>): Promise<MenuProduct>;

  remove(id: string): Promise<MenuProduct>;
}
