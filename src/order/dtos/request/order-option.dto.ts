import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsDecimal, IsInt, IsOptional } from 'class-validator';

export class CreateOrderOptionDto {
  @IsString()
  optionName: string;

  @IsString()
  orderOptionGroupId: string;

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

  @IsString()
  @IsOptional()
  opcionId?: string;
}

export class UpdateOrderOptionDto extends PartialType(CreateOrderOptionDto) {

}
