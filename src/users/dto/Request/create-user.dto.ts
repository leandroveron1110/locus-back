// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client'; // Importa el Enum de Prisma

export class CreateUserDto {
  @IsString({ message: 'El nombre es requerido y debe ser una cadena de texto.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres.' })
  firstName: string;

  @IsString({ message: 'El apellido es requerido y debe ser una cadena de texto.' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
  @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres.' })
  lastName: string;

  @IsEmail({}, { message: 'Debe ser un correo electrónico válido.' })
  email: string;

  @IsString({ message: 'La contraseña es requerida y debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  // En producción, aquí harías una validación más robusta para contraseñas seguras
  password: string;

  @IsEnum(UserRole, { message: 'El rol de usuario no es válido.' })
  // Marca como opcional si tu UsersService le asigna un valor por defecto al crear
  // Si siempre se envía, quita el '?'
  role?: UserRole;
}