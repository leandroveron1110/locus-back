import {
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class DeliveryLocationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}