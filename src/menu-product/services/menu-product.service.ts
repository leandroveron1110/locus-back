import { MenuProduct } from '@prisma/client';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISeccionValidator } from 'src/menu/interfaces/seccion-service.interface';
import { IMenuProductService } from '../interfaces/menu-product-service.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuProductDto } from '../dtos/response/menu-product-response.dto';
import { MenuProductWithOptions } from '../types/menu-product.type';

@Injectable()
export class MenuProductService implements IMenuProductService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(TOKENS.ISeccionValidator)
    private readonly seccionValidatorService: ISeccionValidator,
  ) {}

  async create(dtoCreate: CreateMenuProductDto): Promise<MenuProduct> {
    const { seccionId, menuId, ownerId, businessId, ...dto } = dtoCreate;
    await this.seccionValidatorService.existSeccionAndMenuAndOwnerAndBusiness(
      seccionId,
      menuId,
      ownerId,
      businessId,
    );

    return await this.prisma.menuProduct.create({
      data: {
        ...dto,
        description: dto.description || "",
        enabled: dto.enabled ?? true,
        hasOptions: dto.hasOptions ?? false,
        isMostOrdered: dto.isMostOrdered ?? false,
        isRecommended: dto.isRecommended ?? false,
        seccionId: seccionId,
      },
    });
  }

  async findAll(): Promise<MenuProduct[]> {
    return await this.prisma.menuProduct.findMany({
      include: {
        optionGroups: {
          include: {
            options: {
              include: {
                optionImages: true,
              },
            },
          },
        },
        foodCategories: {
          include: {
            foodCategory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findAllBySeccion(seccionId: string): Promise<MenuProduct[]> {
    return await this.prisma.menuProduct.findMany({
      where: {
        seccionId: seccionId,
      },
      include: {
        optionGroups: {
          include: {
            options: {
              include: {
                optionImages: true,
              },
            },
          },
        },
        foodCategories: {
          include: {
            foodCategory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findAllBySeccionIds(seccionIds: string[]): Promise<MenuProductDto[]> {
    const products = await this.prisma.menuProduct.findMany({
      where: {
        seccionId: { in: seccionIds },
      },
      include: {
        optionGroups: {
          include: {
            options: {
              include: {
                optionImages: true,
              },
            },
          },
        },
        foodCategories: {
          include: {
            foodCategory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return MenuProductDto.fromPrismaMany(products);
  }

  async getMenuProductsByIds(ids: string[]): Promise<MenuProductDto[]> {
    const products = await this.prisma.menuProduct.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        optionGroups: {
          include: {
            options: {
              include: {
                optionImages: true,
              },
            },
          },
        },
        foodCategories: {
          include: {
            foodCategory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return MenuProductDto.fromPrismaMany(products);
  }

  async findProducDetaillById(productId: string): Promise<MenuProductDto> {
    const product = await this.prisma.menuProduct.findUnique({
      where: {
        id: productId,
      },
      include: {
        optionGroups: {
          include: {
            options: {
              include: {
                optionImages: true,
              },
            },
          },
        },
        foodCategories: {
          include: {
            foodCategory: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Menu Product con el id ${productId} no encontrado`,
      );
    }
    return MenuProductDto.fromPrisma(product);
  }

  async findOne(id: string): Promise<MenuProduct> {
    const product = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Menu product not found');
    return product;
  }

  async update(
    id: string,
    dto: Partial<CreateMenuProductDto>,
  ): Promise<MenuProduct> {
    // Asegurarse de que existe antes de actualizar
    const exists = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Menu product not found');

    return await this.prisma.menuProduct.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string): Promise<MenuProduct> {
    const exists = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Menu product not found');

    return await this.prisma.menuProduct.delete({ where: { id } });
  }

  async getMenuProductById(
    menuProductId: string,
  ): Promise<MenuProductWithOptions> {
    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      include: {
        optionGroups: {
          include: { options: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto ${menuProductId} no encontrado.`);
    }

    return product;
  }
}
