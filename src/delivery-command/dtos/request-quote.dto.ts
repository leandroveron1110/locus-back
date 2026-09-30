import {
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { DeliveryLocationDto } from './delivery-location.dto';

export class RequestQuoteDto {
  @IsString()
  orderId: string;

  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  origin: DeliveryLocationDto;

  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  destination: DeliveryLocationDto;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}