// src/search/dto/search-business.dto.ts
import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsInt,
  IsDateString,
} from 'class-validator';

export class SearchBusinessDto {
  @IsOptional()
  @IsString()
  query?: string;
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsBoolean()
  openNow?: boolean;

  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'lastSyncTime debe ser un ISO 8601 válido.' },
  )
  lastSyncTime?: string;
}
