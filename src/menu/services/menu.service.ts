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
public async findAllByBusinessId(businessId: string): Promise<MenuWithSectionsDto[]> {
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

  const products = await this.menuProductService.findAllBySeccionIds(seccionIds);

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
    sections: menu.sections.map((section): MenuSectionWithProductsDto => ({
      id: section.id,
      name: section.name,
      imageUrls: section.imageUrls,
      index: section.index,
      products: productsBySeccion[section.id] ?? [],
    })),
  }));

  return result;
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
