import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateOptionGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  minQuantity: number;

  @IsInt()
  @Min(0)
  maxQuantity: number;

  @IsString()
  @IsIn(['FIXED', 'MIN_MAX'])
  quantityType: string;

  @IsUUID()
  @IsNotEmpty()
  menuProductId: string;
}

export class UpdateOptionGroupDto extends PartialType(CreateOptionGroupDto) {}
