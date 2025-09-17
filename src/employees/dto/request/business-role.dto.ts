// src/employees/dto/business-role.dto.ts
import { IsNotEmpty, IsArray, ArrayNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionEnum } from '@prisma/client';

export class CreateBusinessRoleDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionEnum, { each: true })
  permissions: PermissionEnum[];
}

export class UpdateBusinessRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PermissionEnum, { each: true })
  permissions?: PermissionEnum[];
}
