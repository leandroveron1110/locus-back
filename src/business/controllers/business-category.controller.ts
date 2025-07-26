// src/business/controllers/business-category.controller.ts
import {
  Body,
  Controller,
  Param,
  Patch,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BusinessCategoryService } from '../services/business-category.service'; // Ajusta la ruta
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';
import { TOKENS } from 'src/common/constants/tokens';
import { IsArray, IsUUID } from 'class-validator';

// DTO para la actualización de categorías
// src/business/dto/update-business-categories.dto.ts (o puedes ponerlo en una subcarpeta business/business-category/dto)
class UpdateBusinessCategoriesDto {
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada ID sea un UUID válido
  categoryIds: string[];
}

@Controller('business/:businessId/categories') // Ruta anidada bajo /business
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validacion a nivel de controlador
export class BusinessCategoryController {
  constructor(
    @Inject(TOKENS.IBusinessCategoryService)
    private readonly businessCategoryService: BusinessCategoryService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK) // Indica que la operación fue exitosa
  async updateBusinessCategories(
    @Param('businessId', UuidParam) businessId: string,
    @Body() updateDto: UpdateBusinessCategoriesDto, // updateDto contendrá { categoryIds: string[] }
  ) {

    console.log(updateDto)
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
