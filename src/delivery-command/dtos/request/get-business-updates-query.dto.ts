import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class GetBusinessUpdatesQueryDto {
  @IsString()
  @IsUUID()
  businessId!: string;

  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;
}