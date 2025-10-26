import { IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// Este DTO representa el mapa que viene del frontend: { [businessId]: lastSyncTime }
export class SyncNotificationOrdersDto {
  @IsObject()
  @Type(() => String) // Asegura que los valores (los lastSyncTime) se traten como strings
  public syncTimes: Record<string, string | undefined>;
}