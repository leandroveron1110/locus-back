import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateDeliveryCompanyDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  ownerId: string;
}



export class UpdateDeliveryCompanyDto extends PartialType(CreateDeliveryCompanyDto) {}