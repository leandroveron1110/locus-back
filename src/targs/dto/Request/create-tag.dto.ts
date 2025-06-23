import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean; // Por si se quiere crear un tag inactivo directamente
}