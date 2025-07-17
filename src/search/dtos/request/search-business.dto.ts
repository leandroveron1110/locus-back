// src/search/dto/search-business.dto.ts
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, IsDecimal, Min, Max, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchBusinessDto {
  @IsOptional()
  @IsString()
  q?: string; // Término de búsqueda general (nombre, descripción, etc.)

  @IsOptional()
  @IsString()
  // Asume que categoryId es el nombre de la categoría para buscar en categoryNames
  categoryId?: string; // Por ejemplo, el nombre de la categoría "Restaurante"

  @IsOptional()
  @IsString()
  city?: string; // Nombre de la ciudad

  @IsOptional()
  @IsString()
  province?: string; // Nombre de la provincia

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // Array de nombres de tags (ej. ["PetFriendly", "Wifi Gratis"])

  @ValidateIf(o => o.longitude !== undefined) // Solo valida si longitude está presente
  @IsNumber()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ValidateIf(o => o.latitude !== undefined) // Solo valida si latitude está presente
  @IsNumber()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ValidateIf(o => o.latitude !== undefined && o.longitude !== undefined) // Solo valida si lat y lon están presentes
  @IsNumber()
  @Type(() => Number)
  @Min(0.1) // Radio mínimo de 100 metros (0.1 km)
  @Max(200) // Radio máximo de 200 km
  radiusKm?: number; // Radio de búsqueda en kilómetros

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // Transforma "true"/"false" de query params a boolean
  openNow?: boolean; // Booleano para filtrar negocios abiertos ahora

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number; // Calificación mínima promedio

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  skip?: number; // Para paginación: número de registros a omitir

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100) // Límite para evitar cargas excesivas
  take?: number; // Para paginación: número de registros a tomar

  @IsOptional()
  @IsString()
  // Formato: "campo:direccion" (ej. "name:asc", "averageRating:desc")
  @IsIn(['name:asc', 'name:desc', 'averageRating:asc', 'averageRating:desc', 'createdAt:asc', 'createdAt:desc'])
  orderBy?: string;

  @IsOptional()
  @IsString()
  // Un string JSON para filtros complejos, ej: '{"ecommerce":true}'
  filters?: string;
}