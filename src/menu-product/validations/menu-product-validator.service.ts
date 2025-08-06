import { Injectable, NotFoundException } from '@nestjs/common';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MenuProductValidation implements IExistenceValidator {
  constructor(private readonly prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const count = await this.prisma.menuProduct.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Menu-product con ID ${id} no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const count = await this.prisma.menuProduct.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Uno o más menu-product no existen.');
    }
  }
}
