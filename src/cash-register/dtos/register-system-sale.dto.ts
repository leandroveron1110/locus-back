import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethodTypeFinancial } from '@prisma/client';

export class RegisterSystemSaleDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  clientMovementId: string;

  @IsUUID()
  orderId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethodTypeFinancial)
  paymentMethod: PaymentMethodTypeFinancial;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  externalReference?: string;
}