// dto/create-courier.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CourierStatus, VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCourierDto {
  @IsString()
  @IsNotEmpty()
  dni!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  // En CreateCourierDto y UpdateCourierDto
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courierNumber?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(CourierStatus)
  status?: CourierStatus;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
