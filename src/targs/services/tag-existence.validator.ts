// src/tags/services/tag-existence.validator.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Ajusta la ruta si es necesario
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class TagExistenceValidator implements IExistenceValidator {
  constructor(private prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const tag = await this.prisma.tag.count({ where: { id } });
    if (tag === 0) {
      throw new NotFoundException(`Tag con ID "${id}" no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    const uniqueIds = [...new Set(ids)];
    const count = await this.prisma.tag.count({
      where: {
        id: { in: uniqueIds },
      },
    });

    if (count !== uniqueIds.length) {
      const foundTags = await this.prisma.tag.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      const foundIds = new Set(foundTags.map((t) => t.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Algunos tags no fueron encontrados: ${missingIds.join(', ')}`,
      );
    }
  }
}
