import {
  IsBoolean,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMenuProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsDecimal()
  @IsNotEmpty()
  finalPrice: Decimal;

  @IsDecimal()
  @IsOptional()
  originalPrice?: Decimal;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  currencyMask?: string;

  @IsDecimal()
  @IsOptional()
  finalPriceWithoutTaxes?: Decimal;

  @IsDecimal()
  @IsOptional()
  taxesAmount?: Decimal;

  @IsDecimal()
  @IsOptional()
  discountAmount?: Decimal;

  @IsDecimal()
  @IsOptional()
  discountPercentage?: Decimal;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  discountType?: string[];

  @IsBoolean()
  @IsOptional()
  isCustomizedImage?: boolean;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @IsOptional()
  hasOptions?: boolean;

  @IsBoolean()
  @IsOptional()
  isMostOrdered?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;

  @IsUUID()
  @IsNotEmpty()
  seccionId: string;
}

export class UpdateMenuProduct extends PartialType(CreateMenuProductDto) {}
