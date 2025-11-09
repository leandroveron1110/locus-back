import { IsArray, IsNotEmpty, IsString, IsIn } from 'class-validator';

// Usa tu TargetEntityType real
export enum TargetEntityType {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
}

export class KeysDto {
  @IsString() p256dh: string;
  @IsString() auth: string;
}

export class CreateSubscriptionDto {
  @IsString() endpoint: string;
  @IsNotEmpty() keys: KeysDto;
  
  // ⚠️ Nuevo: El array de IDs a sincronizar
  @IsArray() @IsString({ each: true }) @IsNotEmpty()
  targetEntityIds: string[]; 
  
  // ⚠️ Nuevo: El tipo de entidad al que se suscriben los IDs
  @IsIn(Object.values(TargetEntityType))
  targetEntityType: TargetEntityType;
}