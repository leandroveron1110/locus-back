// src/employees/dto/business-employee.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { EmployeePaymentType, PermissionEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
  @IsNotEmpty()
  @IsString()
  firstName: string;
  @IsNotEmpty()
  @IsString()
  lastName: string;
  @IsNotEmpty()
  @IsString()
  phone: string;
  @IsNotEmpty()
  @IsString()
  positionId: string;
  @IsBoolean()
  active: boolean;
  @IsEnum(EmployeePaymentType)
  paymentType: EmployeePaymentType;
  @IsNotEmpty()
  @IsNumber()
  paymentRate: Decimal;
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  passwordHash: string;
}

export class UpdateBusinessEmployeeDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsArray()
  overrides?: OverrideDto[];

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
  @IsNotEmpty()
  @IsString()
  firstName: string;
  @IsNotEmpty()
  @IsString()
  lastName: string;
  @IsNotEmpty()
  @IsString()
  phone: string;
  @IsNotEmpty()
  @IsString()
  positionId: string;
  @IsBoolean()
  active: boolean;
  @IsEnum(EmployeePaymentType)
  paymentType: EmployeePaymentType;
  @IsNotEmpty()
  @IsNumber()
  paymentRate: Decimal;
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  passwordHash: string;
}

export class OverrideDto {
  @IsEnum(PermissionEnum)
  permission: PermissionEnum;

  @IsBoolean()
  allowed: boolean;
}
