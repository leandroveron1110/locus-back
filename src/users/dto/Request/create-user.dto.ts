import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // 👇 Nueva propiedad para validar que tiene la clave
  @IsOptional()
  @IsString()
  secretKey?: string;
}
