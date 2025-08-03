// create-order.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDecimal, IsInt, ValidateNested, IsArray } from 'class-validator';
import { OrderStatus, OrderOrigin } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateOrderOptionDto {
  @IsString()
  optionName: string;

  @IsString()
  priceModifierType: string;

  @IsInt()
  quantity: number;

  @IsDecimal()
  priceFinal: string;

  @IsDecimal()
  priceWithoutTaxes: string;

  @IsDecimal()
  taxesAmount: string;

  @IsOptional()
  @IsString()
  opcionId?: string;
}

export class CreateOrderOptionGroupDto {
  @IsString()
  groupName: string;

  @IsInt()
  minQuantity: number;

  @IsInt()
  maxQuantity: number;

  @IsString()
  quantityType: string;

  @IsOptional()
  @IsString()
  opcionGrupoId?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderOptionDto)
  options: CreateOrderOptionDto[];
}

export class CreateOrderItemDto {
  @IsString()
  menuProductId: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  productImageUrl?: string;

  @IsInt()
  quantity: number;

  @IsDecimal()
  priceAtPurchase: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderOptionGroupDto)
  optionGroups: CreateOrderOptionGroupDto[];
}

export class CreateOrderFullDto {
  @IsString()
  userId: string;

  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  deliveryAddressId?: string;

  @IsOptional()
  @IsString()
  pickupAddressId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El total debe tener hasta 2 decimales' })
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray ()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}



export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  deliveryAddressId?: string;

  @IsOptional()
  @IsString()
  pickupAddressId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderOrigin)
  origin?: OrderOrigin;

  @IsOptional()
  @IsBoolean()
  isTest?: boolean;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El total debe tener hasta 2 decimales' })
  total: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
