// src/business/services/business-validator.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class BusinessValidatorService implements IExistenceValidator {
  constructor(private readonly prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const exists = await this.prisma.business.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Negocio con ID ${id} no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const existing = await this.prisma.business.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existingSet = new Set(existing.map((b) => b.id));

    const missing = ids.filter((id) => !existingSet.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Negocio(s) no encontrado(s): ${missing.join(', ')}`,
      );
    }
  }
}
