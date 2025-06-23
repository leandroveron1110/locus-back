// src/business/dto/create-business.dto.ts
import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsPhoneNumber,
  IsObject,
  IsNumber,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client'; // Para el tipo JsonValue

export class CreateBusinessDto {
  @ApiProperty({
    description: 'ID del propietario del negocio (Usuario).',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsNotEmpty({ message: 'El ID del propietario no puede estar vacío.' })
  @IsString({ message: 'El ID del propietario debe ser un string.' })
  ownerId: string;

  @ApiProperty({
    description: 'Nombre del negocio.',
    example: 'Cafetería El Buen Día',
  })
  @IsNotEmpty({ message: 'El nombre del negocio no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser un string.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
  name: string;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el negocio.',
    example: 'cat-cafe-123',
  })
  @IsNotEmpty({ message: 'El ID de la categoría no puede estar vacío.' })
  @IsString({ message: 'El ID de la categoría debe ser un string.' })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Descripción corta del negocio (máximo 255 caracteres).',
    example: 'Tu lugar favorito para café y pasteles caseros.',
  })
  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser un string.' })
  @MaxLength(255, {
    message: 'La descripción corta no puede exceder los 255 caracteres.',
  })
  shortDescription?: string;

  @ApiPropertyOptional({
    description: 'Descripción completa y detallada del negocio.',
    example:
      'Amplia variedad de cafés de especialidad, opciones veganas y un ambiente acogedor para trabajar o relajarse.',
  })
  @IsOptional()
  @IsString({ message: 'La descripción completa debe ser un string.' })
  fullDescription?: string;

  @ApiProperty({
    description: 'Dirección física del negocio.',
    example: 'Av. Corrientes 1234, Buenos Aires',
  })
  @IsNotEmpty({ message: 'La dirección no puede estar vacía.' })
  @IsString({ message: 'La dirección debe ser un string.' })
  address: string;

  @ApiProperty({
    description:
      'Número de teléfono de contacto del negocio (formato internacional).',
    example: '+5491112345678',
  })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío.' })
  @IsPhoneNumber('ZA', { message: 'El formato del teléfono no es válido.' }) // 'ZZ' para validación genérica de cualquier país
  phone: string;

  @ApiProperty({
    description: 'Número de WhatsApp del negocio (formato internacional).',
    example: '+5491112345678',
  })
  @IsNotEmpty({ message: 'El número de WhatsApp no puede estar vacío.' })
  @IsString({ message: 'El número de WhatsApp debe ser un string.' }) // Puedes usar IsPhoneNumber si quieres validación estricta
  whatsapp: string;

  @ApiPropertyOptional({
    description: 'Dirección de correo electrónico del negocio.',
    example: 'info@buendia.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  email?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Instagram del negocio.',
    example: 'https://instagram.com/buendia_cafe',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Instagram debe ser una URL válida.' })
  instagramUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Facebook del negocio.',
    example: 'https://facebook.com/buendia.cafe',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Facebook debe ser una URL válida.' })
  facebookUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del sitio web del negocio.',
    example: 'https://www.buendia.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL del sitio web debe ser una URL válida.' })
  websiteUrl?: string;

  @ApiPropertyOptional({
    description:
      'Configuración de los módulos opcionales activados para el negocio (JSON).',
  })
  @IsOptional()
  @IsObject({ message: 'La configuración de módulos debe ser un objeto JSON.' })
  modulesConfig?: Prisma.JsonValue; // Este tipo te permite pasar cualquier JSON válido

  @ApiPropertyOptional({
    description: 'Latitud de la ubicación del negocio.',
    example: -34.6037,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'La latitud debe ser un número.' })
  @IsLatitude({
    message: 'La latitud debe ser una coordenada geográfica válida.',
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de la ubicación del negocio.',
    example: -58.3816,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitud debe ser un número.' })
  @IsLongitude({
    message: 'La longitud debe ser una coordenada geográfica válida.',
  })
  longitude?: number;
}
