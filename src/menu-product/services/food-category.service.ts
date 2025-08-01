// services/food-category.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateFoodCategoryDto, UpdateFoodCategoryDto } from '../dtos/request/food-category-request.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FoodCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFoodCategoryDto) {
    return this.prisma.foodCategory.create({ data: dto });
  }

  async findAll() {
    return this.prisma.foodCategory.findMany();
  }

  async findOne(id: string) {
    const category = await this.prisma.foodCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('FoodCategory not found');
    return category;
  }

  async update(id: string, dto: UpdateFoodCategoryDto) {
    await this.findOne(id); // validación
    return this.prisma.foodCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.foodCategory.delete({ where: { id } });
  }
}
