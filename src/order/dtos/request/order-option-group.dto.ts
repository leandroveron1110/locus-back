import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateOrderOptionGroupDto {
  @IsString()
  groupName: string;

  @IsString()
  orderItemId: string;

  @IsInt()
  minQuantity: number;

  @IsInt()
  maxQuantity: number;

  @IsString()
  quantityType: string;

  @IsOptional()
  @IsString()
  opcionGrupoId?: string;
}

export class UpdateOrderOptionGroupDto extends PartialType(CreateOrderOptionGroupDto){}
