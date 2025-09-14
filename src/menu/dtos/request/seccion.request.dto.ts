import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SeccionCreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  index: number;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsString()
  @IsNotEmpty()
  menuId: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string; // Para validar que el usuario tiene acceso
  @IsString()
  @IsNotEmpty()
  businessId: string; // Para validar que el usuario tiene acceso
}

export class SeccionUpdateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  index: number;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsString()
  @IsNotEmpty()
  menuId: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  businessId: string; // Para validar que el usuario tiene acceso
}
