import { Injectable, NotFoundException } from '@nestjs/common';
import { Tag } from '@prisma/client'; // Importa el tipo Tag de Prisma Client
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from '../dto/Request/create-tag.dto';
import { UpdateTagDto } from '../dto/Request/update-tag.dto';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    try {
      return this.prisma.tag.create({
        data: createTagDto,
      });
    } catch (error) {
      if (error.code === 'P2002') { // Prisma error code for unique constraint violation
        throw new Error(`El tag con nombre "${createTagDto.name}" ya existe.`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Tag[]> {
    // Listamos solo los tags activos, ya que son los que normalmente se muestran en el frontend
    return this.prisma.tag.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }, // Ordenar alfabéticamente por nombre
    });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!tag) {
      throw new NotFoundException(`Tag con ID "${id}" no encontrado.`);
    }
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: updateTagDto,
      });
    } catch (error) {
      if (error.code === 'P2025') { // Prisma error for "record not found"
        throw new NotFoundException(`Tag con ID "${id}" no encontrado.`);
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('nombre')) {
        throw new Error(`Ya existe un tag con el nombre "${updateTagDto.name}".`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Tag> {
    // Implementación de "eliminación lógica" (soft delete)
    // Cambiamos el estado 'active' a 'false'. Los tags pueden seguir existiendo
    // en la tabla de unión `_BusinessToTag` (implícita en Prisma) si un negocio
    // ya los usaba, pero al ser inactivos no se listarán para nuevas asignaciones
    // y pueden ser filtrados en el frontend.
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: { active: false },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tag con ID "${id}" no encontrado.`);
      }
      throw error;
    }
  }
}