import {
  IsString,
  IsUrl,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// Si tu 'type' de imagen va a ser un enum fijo (ej. 'logo', 'gallery', 'banner'),
// puedes definir un enum TypeScript aquí o usar un simple string si es más flexible.
export enum ImageType {
  LOGO = 'logo',
  GALLERY = 'gallery',
  BANNER = 'banner',
  PRODUCT = 'product', // Si Product usa su propia imagen_url, esto puede ser redundante.
  // Considera si Product o MenuItem usaran el modelo Image.
  // Por ahora lo mantengo por si acaso.
}

export class CreateImageDto {
  @IsString()
  @IsUrl()
  url: string;

  @IsString()
  @IsUUID()
  businessId: string; // El ID del negocio al que pertenece la imagen

  @IsOptional()
  @IsString()
  @IsEnum(ImageType) // Valida que el tipo sea uno de los valores definidos en ImageType
  type?: string = ImageType.GALLERY; // Valor por defecto si no se proporciona

  @IsOptional()
  @IsString()
  provider?: string = 'default'; // Proveedor de almacenamiento (ej. 'firebase', 's3', 'cloudinary')

  @IsOptional()
  @Type(() => Number) // Asegura que el valor se transforme a número
  @IsInt()
  order?: number; // Orden para imágenes de galería
}
