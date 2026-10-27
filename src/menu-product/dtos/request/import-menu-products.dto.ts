// dto/import-menu-products.dto.ts

import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ImportMenuProductDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  // Los precios llegan como strings: "13000", "0", etc.
  @IsString()
  finalPrice: string;

  @IsOptional()
  @IsString()
  originalPrice?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  currencyMask?: string;

  @IsOptional()
  @IsString()
  discountPercentage?: string;

  @IsOptional()
  @IsArray()
  discountType?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsBoolean()
  hasOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  isMostOrdered?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @IsUUID()
  seccionId?: string;

  // Se reciben, pero no se guardan en esta importación.
  @IsOptional()
  optionGroups?: unknown[];

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsNumber()
  preparationTime?: number | null;

  @IsOptional()
  @IsBoolean()
  acceptsCash?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsTransfer?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsQr?: boolean;

  @IsOptional()
  cost?: string | number;
}