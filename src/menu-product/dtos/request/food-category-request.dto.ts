// dtos/request/create-food-category.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';

export class CreateFoodCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFoodCategoryDto extends PartialType(CreateFoodCategoryDto) {}
