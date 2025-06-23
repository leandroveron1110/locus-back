// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsString, MinLength, MaxLength, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

// PartialType hace que todas las propiedades de CreateUserDto sean opcionales.
// Esto es útil para actualizaciones donde no todos los campos son necesarios.
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Sobrescribimos 'password' con 'newPassword' y lo hacemos opcional
  @IsOptional()
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  newPassword?: string;

  // Puedes hacer que otras propiedades sean opcionales explícitamente si PartialType no es suficiente
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres.' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
  @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres.' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido.' })
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol de usuario no es válido.' })
  role?: UserRole;

  // Excluimos la propiedad 'password' del CreateUserDto base para evitar confusiones
  // con 'newPassword'. El campo 'password' aquí es solo para el tipado base.
  @IsOptional()
  @IsString()
  password?: string; // Solo para compatibilidad de tipo con PartialType, no se usará directamente
}