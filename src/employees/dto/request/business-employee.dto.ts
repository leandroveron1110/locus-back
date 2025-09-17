// src/employees/dto/business-employee.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { PermissionEnum } from '@prisma/client';

export class CreateBusinessEmployeeDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
}

export class UpdateBusinessEmployeeDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsArray()
  overrides?: OverrideDto[];
}

export class OverrideDto {
  @IsEnum(PermissionEnum)
  permission: PermissionEnum;

  @IsBoolean()
  allowed: boolean;
}
