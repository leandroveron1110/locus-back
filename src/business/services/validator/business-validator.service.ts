// src/business/services/business-validator.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class BusinessValidatorService implements IExistenceValidator {
  constructor(private readonly prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    console.log("negocio id", id)
    const count = await this.prisma.business.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`Negocio con ID ${id} no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const count = await this.prisma.business.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Uno o más negocios no existen.');
    }
  }
}
