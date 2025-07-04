// src/business/dto/Request/create-business.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsPhoneNumber, // Si lo usas, asegúrate de tener 'libphonenumber-js'
  IsUrl,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsArray, // Nuevo para categoryIds
  ArrayMinSize, // Nuevo para categoryIds
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger'; // Solo si usas Swagger

// --- Interfaces para modulesConfig (pueden estar en un archivo separado como types/modules-config.ts) ---
export interface ModuleConfigEntry {
  enabled: boolean;
  url?: string; // Opcional: URL del microservicio si está externalizado
  // Agrega aquí otras configuraciones específicas del módulo si son necesarias
  // Por ejemplo, para productos: showPrices?: boolean;
}

export interface ModulesConfig {
  weeklySchedule?: ModuleConfigEntry;
  offeredServices?: ModuleConfigEntry;
  products?: ModuleConfigEntry;
  menu?: ModuleConfigEntry;
  events?: ModuleConfigEntry;
  // Añade más módulos configurables según tu necesidad
}
// --- Fin de Interfaces para modulesConfig ---

export class CreateBusinessDto {
  @ApiProperty({ description: 'ID del usuario propietario del negocio (UUIDv4).', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'ownerId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'ownerId es requerido.' })
  ownerId: string; // ID del usuario propietario

  @ApiProperty({ description: 'Nombre del negocio.', example: 'Mi Restaurante Favorito' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido.' })
  name: string;

  @ApiProperty({ description: 'Lista de IDs de categorías a asociar con el negocio.', type: [String], example: ['uuid-cat-1', 'uuid-cat-2'], required: true })
  @IsArray({ message: 'categoryIds debe ser un array de IDs de categorías.' })
  @IsUUID('4', { each: true, message: 'Cada categoryId debe ser un UUID válido.' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una categoría.' })
  categoryIds: string[]; // IDs de categorías

  @ApiProperty({ description: 'Descripción corta del negocio.', example: 'Sirviendo la mejor comida local desde 2005.', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción corta no puede estar vacía si está presente.' })
  shortDescription?: string; // Mapeado a 'descripcion_corta'

  @ApiProperty({ description: 'Descripción completa del negocio.', example: 'Un lugar acogedor con una amplia variedad de platos.', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción completa debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción completa no puede estar vacía si está presente.' })
  fullDescription?: string; // Mapeado a 'descripcion_completa'

  @ApiProperty({ description: 'Dirección física del negocio.', example: 'Av. Siempre Viva 742' })
  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La dirección es requerida.' })
  address: string;

  @ApiProperty({ description: 'Número de teléfono de contacto del negocio.', example: '+5491123456789' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es requerido.' })
  // Si usas @IsPhoneNumber, asegúrate de que la librería 'libphonenumber-js' esté instalada y configurada
  // @IsPhoneNumber('AR', { message: 'El teléfono debe ser un número de teléfono válido para Argentina.' })
  phone: string;

  @ApiProperty({ description: 'Número de WhatsApp del negocio.', example: '+5491123456789' })
  @IsString({ message: 'El WhatsApp debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El WhatsApp es requerido.' })
  // @IsPhoneNumber('AR', { message: 'El WhatsApp debe ser un número de teléfono válido para Argentina.' })
  whatsapp: string;

  @ApiProperty({ description: 'Dirección de email de contacto del negocio.', example: 'info@mirestaurante.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  email?: string;

  @ApiProperty({ description: 'ID del estado inicial del negocio (UUIDv4). Si no se proporciona, se usará un estado por defecto.', example: 'uuid-status-active', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'statusId debe ser un UUID válido.' })
  statusId?: string; // ID del estado inicial del negocio

  @ApiProperty({ description: 'URL del perfil de Instagram del negocio.', example: 'https://instagram.com/mirestaurante', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Instagram debe ser una URL válida.' })
  instagramUrl?: string; // Mapeado a 'url_instagram'

  @ApiProperty({ description: 'URL del perfil de Facebook del negocio.', example: 'https://facebook.com/mirestaurante', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Facebook debe ser una URL válida.' })
  facebookUrl?: string; // Mapeado a 'url_facebook'

  @ApiProperty({ description: 'URL del sitio web del negocio.', example: 'https://www.mirestaurante.com', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'La URL del sitio web debe ser una URL válida.' })
  websiteUrl?: string; // Mapeado a 'url_web'

  @IsOptional()
  @IsObject({ message: 'modulesConfig debe ser un objeto válido.' })
  @Type(() => Object) // Usar Type(() => Object) para objetos anidados simples
  modulesConfig?: ModulesConfig; // Mapeado a 'modulos_config'

  @ApiProperty({ description: 'Latitud de la ubicación del negocio.', example: -34.6037, required: false, type: Number })
  @IsOptional()
  @Type(() => Number) // IMPORTANTE: Transforma el string de la request a Number
  @Min(-90, { message: 'La latitud debe ser mayor o igual a -90.' })
  @Max(90, { message: 'La latitud debe ser menor o igual a 90.' })
  // Si usas @IsDecimal, necesitas importarlo y configurar los dígitos.
  // Pero si el campo en el DTO es 'number', los decoradores Min/Max son más adecuados.
  latitude?: number; // Mapeado a 'latitud' (Prisma espera Decimal, se convertirá en el servicio)

  @ApiProperty({ description: 'Longitud de la ubicación del negocio.', example: -58.3816, required: false, type: Number })
  @IsOptional()
  @Type(() => Number) // IMPORTANTE: Transforma el string de la request a Number
  @Min(-180, { message: 'La longitud debe ser mayor o igual a -180.' })
  @Max(180, { message: 'La longitud debe ser menor o igual a 180.' })
  // Si usas @IsDecimal, necesitas importarlo y configurar los dígitos.
  longitude?: number; // Mapeado a 'longitud' (Prisma espera Decimal, se convertirá en el servicio)

  @ApiProperty({ description: 'ID del logo del negocio (UUIDv4).', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'logoId debe ser un UUID válido.' })
  logoId?: string; // Referencia al ID de la imagen en la tabla Image
}