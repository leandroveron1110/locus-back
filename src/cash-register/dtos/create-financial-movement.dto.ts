import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  FinancialMovementType,
  PaymentMethodTypeFinancial,
} from '@prisma/client';

export class CreateFinancialMovementDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  userId: string;
  
  @IsString()
  @IsNotEmpty()
  clientMovementId: string; // ID único de IndexedDB / SQLite local

  @IsEnum(FinancialMovementType)
  type: FinancialMovementType; // INCOME o EXPENSE para flujos manuales

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsEnum(PaymentMethodTypeFinancial)
  paymentMethod: PaymentMethodTypeFinancial;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  externalReference?: string;
}
