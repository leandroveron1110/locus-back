// create-delivery-command-v2.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';

export enum DeliveryCommandActionV2 {
  QUOTE = 'QUOTE',
  DISPATCH = 'DISPATCH',
}

export class CreateDeliveryCommandDtoV2 {
  @IsString()
  businessId: string;

  @IsString()
  orderId: string;

  @IsOptional()
  @IsEnum(DeliveryCommandActionV2)
  action?: DeliveryCommandActionV2;

  @IsOptional()
  @IsString()
  originName?: string;

  @IsOptional()
  @IsString()
  originAddress?: string;

  @IsOptional()
  @IsNumber()
  originLatitude?: number;

  @IsOptional()
  @IsNumber()
  originLongitude?: number;

  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @IsOptional()
  @IsNumber()
  destinationLatitude?: number;

  @IsOptional()
  @IsNumber()
  destinationLongitude?: number;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  quotedCost?: number;

  // --- NUEVAS PROPIEDADES V2 ---

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredCouriers?: number; // Cuántos cadetes necesita (por defecto 1)

  @IsOptional()
  @IsBoolean()
  isShareable?: boolean;     // Si se puede combinar con otro pedido en la misma moto
}