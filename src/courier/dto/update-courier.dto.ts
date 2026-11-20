// dto/update-courier.dto.ts
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { CourierStatus, VehicleType } from "@prisma/client";

export class UpdateCourierDto {
  @IsOptional()
  @IsString()
  fullName?: string;

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