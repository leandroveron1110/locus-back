// C:\Users\leand\Documents\locus-back\src\users\dto\Response\user-response.dto.ts
import { UserRole } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer'; // ¡Asegúrate de que 'Type' esté aquí!
import { IsString, IsEmail, IsEnum, IsDate } from 'class-validator';

export class UserResponseDto {
  @IsString()
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsDate()
  @Type(() => Date) // Ahora este decorador debería funcionar
  createdAt: Date;

  @IsDate()
  @Type(() => Date) // Y este también
  updatedAt: Date;

  @Exclude()
  passwordHash: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}