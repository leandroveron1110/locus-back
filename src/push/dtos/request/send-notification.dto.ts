import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { TargetEntityType } from 'src/notification/dto/request/create-notification.dto';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  targetEntityId: string; // El ID del usuario al que queremos notificar

  @IsString()
  @IsNotEmpty()
  title: string; // Título de la notificación

  @IsEnum(TargetEntityType) // Asumiendo que TargetEntityType está definido
  @IsNotEmpty()
  targetEntityType: TargetEntityType;

  @IsString()
  @IsOptional()
  message: string; // Cuerpo de la notificación
}
