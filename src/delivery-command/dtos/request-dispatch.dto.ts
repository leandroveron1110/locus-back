import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RequestDispatchDto {
  @IsString()
  dispatchId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  originPaymentAmount?: number;

  @IsOptional()
  @IsBoolean()
  originPaymentDeferred?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}