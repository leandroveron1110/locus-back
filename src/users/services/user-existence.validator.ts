// src/categories/services/category-existence.validator.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserValidator } from '../interfaces/User-service.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserExistenceValidator implements IUserValidator {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
  ) {}

  async existBusinessAndOwner(
    businessId: string,
    owenerId: string,
  ): Promise<void> {
    const owner = await this.prisma.user.count({
      where: {
        id: owenerId
      },
    });

    if (!owner) {
      throw new NotFoundException(`Owner con ID "${owenerId}" no encontrada.`);
    }

    await this.businessValidator.checkOne(businessId);
  }

  async checkOne(id: string): Promise<void> {
    const user = await this.prisma.user.count({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User con ID "${id}" no encontrada.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return; // No hay nada que verificar
    }
    const uniqueIds = [...new Set(ids)];
    const count = await this.prisma.user.count({
      where: {
        id: { in: uniqueIds },
      },
    });

    if (count !== uniqueIds.length) {
      // Opcional: Para un mensaje más específico, puedes encontrar cuáles IDs faltan
      const foundCategories = await this.prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      const foundIds = new Set(foundCategories.map((c) => c.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Algunas users no fueron encontrados: ${missingIds.join(', ')}`,
      );
    }
  }
}
