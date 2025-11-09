import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Clase interna para las claves criptográficas
class SubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

// DTO principal para la suscripción
export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;

  // ⚠️ Nuevo campo requerido: El ID del usuario que se suscribe
  // Este campo debe ser enviado por el frontend, típicamente extraído de la sesión/token.
  @IsString()
  @IsNotEmpty()
  userId: string;
}

// Opcional: DTO para el envío de notificaciones
// (Solo para referencia, asumo que ya lo tienes o es similar)
export class CreateNotificationDto {
  // ... (otros campos como recipientId, title, message, link)
}