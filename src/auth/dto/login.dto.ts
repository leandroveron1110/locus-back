// src/auth/dto/login.dto.ts
import { UserRole } from '@prisma/client';
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  email: string;

  @IsString({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsEnum(UserRole)
  role: UserRole
}