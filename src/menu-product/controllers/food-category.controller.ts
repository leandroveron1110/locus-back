import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { FoodCategoryService } from '../services/food-category.service';
import { CreateFoodCategoryDto, UpdateFoodCategoryDto } from '../dtos/request/food-category-request.dto';

@Controller('food-categories')
export class FoodCategoryController {
  constructor(private readonly service: FoodCategoryService) {}

  @Post()
  create(@Body() dto: CreateFoodCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFoodCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
