// src/menu/interfaces/menu-product-service.interface.ts

import { MenuProduct } from '@prisma/client';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { MenuProductDto } from '../dtos/response/menu-product-response.dto';
import { MenuProductWithOptions } from '../types/menu-product.type';

export interface IMenuProductService {
  create(dto: CreateMenuProductDto): Promise<MenuProduct>;

  findAll(): Promise<MenuProduct[]>;

  getMenuProductsByIds(ids: string[]): Promise<MenuProductDto[]>;

  findProducDetaillById(productId: string): Promise<MenuProductDto>;

  findAllBySeccionIdsForBusiness(
    seccionIds: string[],
  ): Promise<MenuProductDto[]>;

  findPaginatedBySeccionId(
    seccionId: string,
    limit: number,
    offset: number,
  ): Promise<MenuProductDto[]>;

  findAllBySeccion(seccionId: string): Promise<MenuProduct[]>;

  findAllBySeccionIds(seccionIds: string[]): Promise<MenuProductDto[]>;

  findOne(id: string): Promise<MenuProduct>;

  update(id: string, dto: Partial<CreateMenuProductDto>): Promise<MenuProduct>;

  remove(id: string): Promise<MenuProduct>;

  getMenuProductById(menuProductId: string): Promise<MenuProductWithOptions>;
}
