// src/dtos/request/add-tags.dto.ts
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class TagsDto {
  @IsArray()
  @IsString({ each: true }) // Asegura que cada elemento del array sea un string
  @IsNotEmpty({ each: true }) // Asegura que cada string no esté vacío
  tags: string[];
}