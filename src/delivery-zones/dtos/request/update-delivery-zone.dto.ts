// src/dtos/request/update-delivery-zone.dto.ts

import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  price?: number;

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
}