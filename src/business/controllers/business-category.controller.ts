// src/business/controllers/business-category.controller.ts
import {
  Body,
  Controller,
  Param,
  Patch,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BusinessCategoryService } from '../services/business-category.service'; // Ajusta la ruta

// DTO para la actualización de categorías
// src/business/dto/update-business-categories.dto.ts (o puedes ponerlo en una subcarpeta business/business-category/dto)
class UpdateBusinessCategoriesDto {
  categoryIds: string[];
}

@Controller('business/:businessId/categories') // Ruta anidada bajo /business
export class BusinessCategoryController {
  constructor(
    private readonly businessCategoryService: BusinessCategoryService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK) // Indica que la operación fue exitosa
  async updateBusinessCategories(
    @Param('businessId') businessId: string,
    @Body() updateDto: UpdateBusinessCategoriesDto, // updateDto contendrá { categoryIds: string[] }
  ) {
    // Delega la lógica al servicio
    await this.businessCategoryService.associateBusinessWithCategories(
      businessId,
      updateDto.categoryIds,
    );
    return { message: 'Business categories updated successfully.' };
  }

  @Get()
  async getBusinessCategories(@Param('businessId') businessId: string) {
    return this.businessCategoryService.getCategoriesByBusinessId(businessId);
  }
}
