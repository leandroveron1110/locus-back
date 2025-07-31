import { Inject, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IMenuValidator } from 'src/menu/interfaces/menu-service.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserValidator } from 'src/users/interfaces/User-service.interface';

export class MenuValidatorService implements IMenuValidator {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IUserValidator)
    private readonly userValidator: IUserValidator,
  ) {}

  async existMenuAndOwnerAndBusiness(
    menuId: string,
    ownerId: string,
    businessId: string,
  ): Promise<void> {
    await this.userValidator.existBusinessAndOwner(businessId, ownerId);
    await this.checkOne(menuId);
  }
  async checkOne(id: string): Promise<void> {
    const count = await this.prisma.menu.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Menu con ID ${id} no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const count = await this.prisma.menu.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Uno o más menus no existen.');
    }
  }
}
