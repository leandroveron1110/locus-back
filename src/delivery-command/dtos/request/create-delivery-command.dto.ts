// dto/create-delivery-command.dto.ts
import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { DeliveryCommandType } from '@prisma/client';

export class CreateDeliveryCommandDto {
  @IsString()
  businessId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsEnum(DeliveryCommandType)
  command: DeliveryCommandType;

  // Origen
  @IsString() @IsOptional() originName?: string;
  @IsString() @IsOptional() originAddress?: string;
  @IsNumber() @IsOptional() originLatitude?: number;
  @IsNumber() @IsOptional() originLongitude?: number;

  // Destino
  @IsString() @IsOptional() destinationAddress?: string;
  @IsNumber() @IsOptional() destinationLatitude?: number;
  @IsNumber() @IsOptional() destinationLongitude?: number;
  @IsString() @IsOptional() zoneId?: string;
  @IsString() @IsOptional() notes?: string;
}
