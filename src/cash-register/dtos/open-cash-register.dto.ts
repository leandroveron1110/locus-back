import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenCashRegisterDto {
    @IsUUID()
    businessId: string;
  
    @IsUUID()
    userId: string;
  @IsNotEmpty({ message: 'El clientTurnId es obligatorio para la sincronización offline.' })
  @IsString()
  clientTurnId: string;

  @IsNotEmpty({ message: 'El monto de apertura es obligatorio.' })
  @IsNumber({}, { message: 'El monto de apertura debe ser un número válido.' })
  @Min(0, { message: 'El monto de apertura no puede ser negativo.' })
  @Type(() => Number)
  openingAmount: number;

  @IsOptional()
  @IsString()
  openingNotes?: string;
}