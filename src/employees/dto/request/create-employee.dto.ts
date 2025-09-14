import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { BusinessEmployeeRole, DeliveryEmployeeRole } from '@prisma/client';

export class CreateBusinessEmployeeDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  businessId: string;

  @IsEnum(BusinessEmployeeRole)
  role: BusinessEmployeeRole;

  @IsOptional()
  permissions?: string[];
}

export class CreateDeliveryEmployeeDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  deliveryCompanyId: string;

  @IsEnum(DeliveryEmployeeRole)
  role: DeliveryEmployeeRole;

  @IsOptional()
  permissions?: string[];
}
