import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { NotificationCategory, NotificationPriority } from '@prisma/client';

// 💡 Definición del Enum para los tipos de entidad
export enum TargetEntityType {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
  // Agregar otros tipos aquí si es necesario (ADMIN, GROUP, etc.)
}

export class CreateNotificationDto {
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  // 💡 Campo para el ID de la entidad objetivo (USER o BUSINESS)
  @IsUUID('4', { message: 'targetEntityId debe ser un UUID válido.' })
  @IsNotEmpty()
  targetEntityId: string;

  // 💡 Campo para el tipo de la entidad objetivo
  @IsEnum(TargetEntityType)
  @IsNotEmpty()
  targetEntityType: TargetEntityType;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
