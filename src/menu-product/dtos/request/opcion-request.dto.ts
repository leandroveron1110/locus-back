// src/option/dto/create-opcion.dto.ts
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOpcionDto {
  @IsOptional()
  @IsInt()
  legacyId?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  hasStock: boolean;

  @IsInt()
  index: number;

  @IsDecimal({ decimal_digits: '0,2' })
  priceFinal: string;

  @IsDecimal({ decimal_digits: '0,2' })
  priceWithoutTaxes: string;

  @IsDecimal({ decimal_digits: '0,2' })
  taxesAmount: string;

  @IsString()
  priceModifierType: 'NOT_CHANGE' | 'INCREASE';

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @IsUUID()
  optionGroupId: string;
}
