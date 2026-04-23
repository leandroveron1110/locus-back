// src/delivery-zones/dto/create-delivery-zone.dto.ts

import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsObject,
  IsBoolean, // Nuevo
  IsOptional,
  IsEmpty,
  isObject, // Nuevo
} from 'class-validator';
import { Type } from 'class-transformer';

// Define el DTO para la geometría GeoJSON
export class GeoJsonPolygonDto {
  @IsString()
  @IsNotEmpty()
  type: 'Polygon';

  @IsArray()
  @IsNotEmpty()
  coordinates: number[][][];
}

export class PriceMatrixItemDto {
  @IsString()
  @IsNotEmpty()
  macroZoneId: string;

  @IsNumber()
  price: number;
}

// Define el DTO para la creación de una zona
export class CreateDeliveryZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceMatrixItemDto)
  @IsOptional()
  priceMatrix?: PriceMatrixItemDto[];

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  geometry: GeoJsonPolygonDto;

  @IsBoolean()
  hasTimeLimit: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsBoolean()
  isActive: boolean = true;
}
