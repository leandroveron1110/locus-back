import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuCreateDto, MenuUpdateDto } from '../dtos/request/menu.request.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserValidator } from 'src/users/interfaces/User-service.interface';
import { IMenuService } from '../interfaces/menu-service.interface';
import { ISeccionService } from '../interfaces/seccion-service.interface';
import { IMenuProductService } from 'src/menu-product/interfaces/menu-product-service.interface';
import { MenuWithSectionsDto } from '../dtos/response/menu-res.dto';
import { MenuProductDto } from 'src/menu-product/dtos/response/menu-product-response.dto';
import { MenuSectionWithProductsDto } from '../dtos/response/seccion-res.dto';

@Injectable()
export class MenuService implements IMenuService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IUserValidator)
    private readonly userValidator: IUserValidator,
    @Inject(TOKENS.IMenuProductService)
    private readonly menuProductService: IMenuProductService,
  ) {}

  // CREATE
  public async createMenu(menu: MenuCreateDto) {
    await this.userValidator.existBusinessAndOwner(
      menu.businessId,
      menu.ownerId,
    );

    const newMenu = await this.prisma.menu.create({
      data: {
        name: menu.name,
        businessId: menu.businessId,
      },
    });

    return newMenu;
  }

  public async findAll() {
    const menus = await this.prisma.menu.findMany();
    return menus;
  }

  // READ ALL
  public async findAllByBusinessId(
    businessId: string,
  ): Promise<MenuWithSectionsDto[]> {
    const menus = await this.prisma.menu.findMany({
      where: { businessId },
      include: {
        sections: {
          select: {
            id: true,
            imageUrls: true,
            index: true,
            name: true,
          },
          orderBy: {
            index: 'asc',
          },
        },
      },
    });

    const seccionIds: string[] = menus.flatMap((menu) =>
      menu.sections.map((section) => section.id),
    );

    const products =
      await this.menuProductService.findAllBySeccionIds(seccionIds);

    // Agrupar productos por seccionId
    const productsBySeccion: Record<string, MenuProductDto[]> = {};
    for (const product of products) {
      const id = product.seccionId;
      if (!productsBySeccion[id]) productsBySeccion[id] = [];
      productsBySeccion[id].push(product);
    }

    // Construir DTO completo
    const result: MenuWithSectionsDto[] = menus.map((menu) => ({
      id: menu.id,
      businessId,
      name: menu.name,
      sections: menu.sections.map(
        (section): MenuSectionWithProductsDto => ({
          id: section.id,
          name: section.name,
          imageUrls: section.imageUrls,
          index: section.index,
          products: productsBySeccion[section.id] ?? [],
        }),
      ),
    }));

    return result;
  }

  public async findAllByBusinessIdForBusiness(
    businessId: string,
  ): Promise<MenuWithSectionsDto[]> {
    const menus = await this.prisma.menu.findMany({
      where: { businessId },
      include: {
        sections: {
          select: { id: true, index: true, name: true },
          orderBy: { index: 'asc' },
        },
      },
    });

    const seccionIds: string[] = menus.flatMap((menu) =>
      menu.sections.map((section) => section.id),
    );

    const products =
      await this.menuProductService.findAllBySeccionIdsForBusiness(seccionIds);

    // Agrupar productos por seccionId

    const productsBySeccion = products.reduce<Record<string, MenuProductDto[]>>(
      (acc, product) => {
        (acc[product.seccionId] ??= []).push(product);
        return acc;
      },
      {},
    );

    // Construir DTO completo
    return menus.map((menu) => ({
      id: menu.id,
      businessId,
      name: menu.name,
      sections: menu.sections.map((section) => ({
        id: section.id,
        name: section.name,
        imageUrls: [],
        index: section.index,
        products: productsBySeccion[section.id] ?? [],
      })),
    }));
  }

  public async findBusinessesWithDiscountedProducts() {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Buscar productos con descuento
      const discountedProducts = await tx.menuProduct.findMany({
        where: {
          isDeleted: false,
          enabled: true,
          available: true,
          OR: [
            { discountAmount: { not: null, gt: 0 } },
            { discountPercentage: { not: null, gt: 0 } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          finalPrice: true,
          originalPrice: true,
          discountAmount: true,
          discountPercentage: true,
          currency: true,
          currencyMask: true,
          imageUrl: true,
          seccionId: true,
        },
      });

      if (discountedProducts.length === 0) return [];

      // 2️⃣ Buscar secciones y menús relacionados (usando los IDs de secciones)
      const seccionIds = [
        ...new Set(discountedProducts.map((p) => p.seccionId)),
      ];

      const secciones = await tx.seccion.findMany({
        where: { id: { in: seccionIds }, isDeleted: false },
        select: {
          id: true,
          name: true,
          index: true,
          menuId: true,
        },
      });

      const menuIds = [...new Set(secciones.map((s) => s.menuId))];

      const menus = await tx.menu.findMany({
        where: { id: { in: menuIds }, isDeleted: false },
        select: {
          id: true,
          name: true,
          businessId: true,
        },
      });

      const businessIds = [...new Set(menus.map((m) => m.businessId))];

      const businesses = await tx.business.findMany({
        where: { id: { in: businessIds }, isDeleted: false },
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      });

      // 3️⃣ Reconstruir la jerarquía en memoria
      const businessMap: Record<string, any> = {};
      for (const business of businesses) {
        businessMap[business.id] = {
          id: business.id,
          name: business.name,
          logoUrl: business.logoUrl,
          menus: [],
        };
      }

      for (const menu of menus) {
        const business = businessMap[menu.businessId];
        if (!business) continue;

        business.menus.push({
          id: menu.id,
          name: menu.name,
          sections: [],
        });
      }

      for (const seccion of secciones) {
        const menu = menus.find((m) => m.id === seccion.menuId);
        if (!menu) continue;

        const business = businessMap[menu.businessId];
        if (!business) continue;

        const menuObj = business.menus.find((m) => m.id === menu.id);
        if (!menuObj) continue;

        menuObj.sections.push({
          id: seccion.id,
          name: seccion.name,
          index: seccion.index,
          products: discountedProducts.filter(
            (p) => p.seccionId === seccion.id,
          ),
        });
      }

      return Object.values(businessMap);
    });
  }

  // READ ONE
  public async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with id '${id}' not found.`);
    }

    return menu;
  }

  // UPDATE
  public async updateMenu(id: string, data: MenuUpdateDto) {
    if (!data.businessId || !data.ownerId) {
      throw new BadRequestException(`Falta mandar businessId o ownerId`);
    }

    await this.userValidator.existBusinessAndOwner(
      data.businessId,
      data.ownerId,
    );
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException(`Menu with id '${id}' not found.`);
    }

    return this.prisma.menu.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
  }

  // DELETE
  public async deleteMenu(id: string) {
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException(`Menu with id '${id}' not found.`);
    }

    return this.prisma.menu.delete({
      where: { id },
    });
  }
}
