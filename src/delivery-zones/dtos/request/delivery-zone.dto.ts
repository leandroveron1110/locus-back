// src/delivery-zones/dto/create-delivery-zone.dto.ts

import { IsString, IsNumber, IsNotEmpty, IsArray, ValidateNested, IsObject } from 'class-validator';
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

// Define el DTO para la creación de una zona
export class CreateDeliveryZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => GeoJsonPolygonDto)
  geometry: GeoJsonPolygonDto;
}