import { IsNotEmpty, IsString } from 'class-validator';

export class InitializeCashRegisterDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  clientTurnId: string;
}