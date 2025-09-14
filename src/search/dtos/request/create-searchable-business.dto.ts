// src/search/dto/create-searchable-business.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsObject,
  IsUUID,
  Min,
  Max,
  IsJSON,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSearchableBusinessDto {
  // @IsUUID()
  @IsNotEmpty()
  id: string; // Este debe ser el ID del negocio original

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryNames?: string[]; // Array de nombres de categorías

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[]; // Array de nombres de tags

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5) // Asumiendo calificación máxima de 5
  averageRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  reviewCount?: number;

  @IsOptional()
  @IsString()
  status?: string; // Ej. "ACTIVE", "PENDING_REVIEW"

  @IsOptional()
  @IsString()
  logoUrl?: string; // URL directa del logo

  @IsOptional()
  @IsString()
  @IsJSON() // Valida que sea un string JSON
  horarios?: string; // Horarios semanales como un string JSON (ej. '{"MONDAY":"09:00-18:00"}')

  @IsOptional()
  @IsString()
  @IsJSON() // Valida que sea un string JSON
  modulesConfig?: string; // Configuración de módulos como un string JSON
}