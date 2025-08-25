// src/business-payment-methods/dto/create-business-payment-method.dto.ts
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID del negocio' })
  businessId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Alias del método de pago (ej: Alias Bancario)' })
  alias: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Número de cuenta, CBU o QR' })
  account: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del titular de la cuenta' })
  holderName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Instrucciones opcionales para el pago' })
  instructions?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: 'Indica si el método de pago está activo' })
  isActive?: boolean;
}