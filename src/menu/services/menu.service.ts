import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuCreateDto, MenuUpdateDto } from '../dtos/request/menu.request.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserValidator } from 'src/users/interfaces/User-service.interface';
import { IMenuService } from '../interfaces/menu-service.interface';

@Injectable()
export class MenuService implements IMenuService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IUserValidator)
    private readonly userValidator: IUserValidator,
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

  // READ ALL
  public async findAllByBusinessId(businessId: string) {
    const menus = await this.prisma.menu.findMany({
      where: { businessId: businessId },
    });

    return menus;
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
