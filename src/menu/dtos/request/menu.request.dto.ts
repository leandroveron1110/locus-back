import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MenuCreateDto {
  @IsNotEmpty({ message: 'ownerId es requerido.' })
  ownerId: string; // ID del usuario propietario
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido.' })
  @IsUUID('4', { message: 'businessId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'businessId es requerido.' })
  businessId: string;
  name: string;
}

export class MenuUpdateDto extends PartialType(MenuCreateDto){}
