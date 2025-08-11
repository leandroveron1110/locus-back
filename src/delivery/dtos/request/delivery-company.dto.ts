import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateDeliveryCompanyDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsArray()
  @IsString({ each: true })
  zones: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  ownerId: string;
}



export class UpdateDeliveryCompanyDto extends PartialType(CreateDeliveryCompanyDto) {}