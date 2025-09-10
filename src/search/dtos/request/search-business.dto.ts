// src/search/dto/search-business.dto.ts
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, IsDecimal, Min, Max, IsIn, ValidateIf, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchBusinessDto {
  @IsOptional() @IsString()
  query?: string
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  province?: string;

  @IsOptional() @IsArray()
  categories?: string[];

  @IsOptional() @IsArray()
  tags?: string[];

  @IsOptional() @IsInt()
  page?: number;

  @IsOptional() @IsInt()
  limit?: number;

  @IsOptional() @IsBoolean()
  openNow?: boolean;
}
