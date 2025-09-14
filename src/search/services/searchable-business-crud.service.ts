import { Prisma, SearchableBusiness } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBusinessDto,
  UperrBusinessDto,
} from '../dtos/request/create-business-dto';
import { ISearchableBusinessCrudService } from '../interfaces/searchable-business-crud-service.interface';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class SearchableBusinessCrudService
  implements ISearchableBusinessCrudService
{
  constructor(private prisma: PrismaService) {}

  async checkOne(id: string): Promise<void> {
    const r = await this.prisma.searchableBusiness.findMany();
    const count = await this.prisma.searchableBusiness.count({
      where: { id: id },
    });
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
    try {
      const rest = await this.prisma.searchableBusiness.create({
        data: {
          id: data.id,
          name: data.name,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          address: data.address,
          city: data.city,
          province: data.province,
          latitude: data.latitude,
          longitude: data.longitude,
          modulesConfig: data.modulesConfig,
          categoryNames: [],
          tagNames: [],
        },
      });

      return rest;
    } catch (error) {
      console.log(error);
    }
  }
  async update(data: UperrBusinessDto): Promise<any> {
    await this.prisma.searchableBusiness.update({
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

  async findOne<T extends Prisma.SearchableBusinessSelect>(
    id: string,
    select: T,
  ): Promise<Prisma.SearchableBusinessGetPayload<{ select: T }>> {
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id },
      select,
    });

    if (!business) {
      throw new NotFoundException(`Negocio con ID ${id} no encontrado.`);
    }

    return business;
  }

  async incrementFollowersCount(id: string, amount = 1): Promise<void> {
    await this.prisma.searchableBusiness.update({
      where: { id },
      data: {
        followersCount: {
          increment: amount,
        },
      },
    });
  }

  async decrementFollowersCount(id: string, amount = 1): Promise<void> {
    await this.prisma.searchableBusiness.update({
      where: { id },
      data: {
        followersCount: {
          decrement: amount,
        },
      },
    });
  }
}
