// src/modules/business/dto/request/add-image-to-business.dto.ts

import { IsString, IsUrl, IsOptional, IsInt, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageType } from 'src/common/enums/image-type.enum';

// Reutilizamos el ImageType definido en el módulo Image para consistencia

export class AddImageToBusinessDto {
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  @IsUrl({}, { message: 'La URL de la imagen debe ser una URL válida.' })
  @IsNotEmpty({ message: 'La URL de la imagen es requerida.' })
  url: string;

  @IsOptional()
  @IsString({ message: 'El tipo de imagen debe ser una cadena de texto.' })
  @IsEnum(ImageType, { message: `El tipo de imagen debe ser uno de los valores válidos: ${Object.values(ImageType).join(', ')}.` })
  type?: ImageType = ImageType.GALLERY; // Por defecto 'gallery'

  @IsOptional()
  @IsString({ message: 'El proveedor de la imagen debe ser una cadena de texto.' })
  provider?: string = 'default'; // Ej: 'firebase', 's3', 'cloudinary'

  @IsOptional()
  @Type(() => Number) // Asegura que el valor se transforme a número
  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(0, { message: 'El orden no puede ser negativo.' })
  order?: number; // Para ordenar imágenes de galería
}