import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProvideQuoteDto {
  @IsString()
  commandId: string;

  @IsInt()
  @Min(0)
  quotedCost: number;

  @IsOptional()
  @IsDateString()
  quoteExpiresAt?: string;
}