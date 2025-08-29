import { IsEnum, IsOptional } from 'class-validator';
import { BusinessEmployeeRole, DeliveryEmployeeRole } from '@prisma/client';

export class UpdateBusinessEmployeeDto {
  @IsOptional()
  @IsEnum(BusinessEmployeeRole)
  role?: BusinessEmployeeRole;

  @IsOptional()
  permissions?: string[];
}

export class UpdateDeliveryEmployeeDto {
  @IsOptional()
  @IsEnum(DeliveryEmployeeRole)
  role?: DeliveryEmployeeRole;

  @IsOptional()
  permissions?: string[];
}
