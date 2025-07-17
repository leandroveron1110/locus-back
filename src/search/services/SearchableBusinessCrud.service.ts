import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBusinessDto,
  UperrBusinessDto,
} from '../dtos/request/create-business-dto';
import { ISearchableBusinessCrudService } from '../interfaces/serach-crud-service.interface';
import { NotFoundException } from '@nestjs/common';

export class SearchableBusinessCrudService
  implements ISearchableBusinessCrudService
{
  constructor(private prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const count = await this.prisma.searchableBusiness.count({ where: { id } });
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

  async create(data: CreateBusinessDto): Promise<any> {
    this.prisma.searchableBusiness.create({
      data: {
        ...data,
      },
    });
  }
  async update(data: UperrBusinessDto): Promise<any> {
    this.prisma.searchableBusiness.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
      },
    });
  }
  async delete(id: string): Promise<void> {
    this.prisma.$transaction(async (t) => {});
  }
}
