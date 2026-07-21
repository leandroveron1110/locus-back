import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseCashRegisterDto {
      @IsUUID()
      businessId: string;
    
      @IsUUID()
      userId: string;
  @IsNotEmpty({ message: 'Debes declarar el monto total de cierre.' })
  @IsNumber({}, { message: 'El monto declarado debe ser un número válido.' })
  @Min(0, { message: 'El monto de cierre no puede ser negativo.' })
  @Type(() => Number)
  declaredClosingAmount: number;

  @IsOptional()
  @IsString()
  closingNotes?: string;
}