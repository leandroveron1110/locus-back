import { ImageType } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';

// NOTA: Si usas NestJS, puedes usar los decoradores de class-validator.
export class CreateGlobalImageDto {
  
  @IsEnum(ImageType, {
    message: `imageType must be a valid ImageType: ${Object.values(ImageType).join(', ')}`,
  })
  @IsOptional()
  imageType?: ImageType; // Tipo de la imagen (e.g., GENERAL, BACKGROUND)
  
  @IsString()
  @IsOptional()
  folderPath?: string; // Ruta de la carpeta de almacenamiento (e.g., 'global-catalog/backgrounds')

  @IsString()
  name: string;

  @IsString()
  altText: string;

  @IsString()
  description: string;

  @IsString()
  tags: string[];
}