import { IsInt, IsString, IsOptional, IsDecimal, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderOptionGroupDto } from './order-option-group.dto';

export class CreateOrderItemDto {
  @IsString()
  orderId: string;

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

}


export class UpdateOrderItemDto extends PartialType(CreateOrderItemDto) {}