import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client'; // Importa el tipo Category de Prisma Client
import { CreateCategoryDto } from '../dto/Request/create-category.dto';
import { UpdateCategoryDto } from '../dto/Request/update-category.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      return this.prisma.category.create({
        data: createCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') { // Prisma error code for unique constraint violation
        throw new Error(`La categoría con nombre "${createCategoryDto.name}" ya existe.`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    // Por lo general, se listan solo las categorías activas para el frontend
    return this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }, // Ordenar alfabéticamente por nombre
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2025') { // Código de error de Prisma para "registro no encontrado"
        throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
         throw new Error(`Ya existe una categoría con el nombre "${updateCategoryDto.name}".`);
      }
      throw error; // Re-lanza otros errores
    }
  }

  async remove(id: string): Promise<Category> {
    // Implementación de "eliminación lógica" (soft delete)
    // Se cambia el estado 'active' a 'false' en lugar de borrar el registro físicamente.
    // Esto es crucial si la categoría ya está asociada a negocios existentes,
    // para evitar errores de clave foránea y mantener la integridad histórica.
    try {
      return await this.prisma.category.update({
        where: { id },
        data: { active: false },
      });
    } catch (error) {
      if (error.code === 'P2025') { // Registro no encontrado
        throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
      }
      // No deberías tener un P2003 (ForeignKeyConstraintViolation) con soft delete,
      // pero si cambiaras a delete físico, deberías manejarlo.
      throw error;
    }
  }
}