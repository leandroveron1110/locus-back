// src/dtos/request/add-categories.dto.ts
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class CategoriesDto {
  @IsArray()
  @IsString({ each: true }) // Asegura que cada elemento del array sea un string
  @IsNotEmpty({ each: true }) // Asegura que cada string no esté vacío
  categories: string[];
}