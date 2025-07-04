// src/categories/services/category-existence.validator.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Ajusta la ruta si es necesario
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

@Injectable()
export class CategoryExistenceValidator implements IExistenceValidator {
  constructor(private prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const category = await this.prisma.category.count({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return; // No hay nada que verificar
    }
    const uniqueIds = [...new Set(ids)];
    const count = await this.prisma.category.count({
      where: {
        id: { in: uniqueIds },
      },
    });

    if (count !== uniqueIds.length) {
      // Opcional: Para un mensaje más específico, puedes encontrar cuáles IDs faltan
      const foundCategories = await this.prisma.category.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true }
      });
      const foundIds = new Set(foundCategories.map(c => c.id));
      const missingIds = uniqueIds.filter(id => !foundIds.has(id));
      throw new NotFoundException(`Algunas categorías no fueron encontradas: ${missingIds.join(', ')}`);
    }
  }
}