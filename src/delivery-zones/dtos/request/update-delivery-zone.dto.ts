// src/dtos/request/update-delivery-zone.dto.ts

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PriceMatrixItemDto {

  @IsString()
  @IsNotEmpty()
  deliveryZoneId: string;
  @IsString()
  @IsNotEmpty()
  macroZoneId: string;

  @IsNumber()
  price: number;
}

export class UpdateDeliveryZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  hasTimeLimit?: boolean;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceMatrixItemDto)
  @IsOptional()
  priceMatrices?: PriceMatrixItemDto[];
}
