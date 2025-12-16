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
import { Type } from 'class-transformer';

export class CreateMenuProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  preparationTime?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  available: boolean;

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

  // validaciones
  @IsUUID()
  @IsNotEmpty()
  seccionId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsNotEmpty()
  menuId: string;
  @IsUUID()
  @IsNotEmpty()
  ownerId: string;

  // --- Configuración general de formas de pago ---
  @IsBoolean({ message: 'acceptsCash debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsCash: boolean = true;

  @IsBoolean({ message: 'acceptsTransfer debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsTransfer: boolean = true;

  @IsBoolean({ message: 'acceptsQr debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsQr: boolean = false;
}

export class UpdateMenuProduct extends PartialType(CreateMenuProductDto) {}
