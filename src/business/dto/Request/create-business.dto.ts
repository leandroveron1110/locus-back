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
  @IsUUID('4', { message: 'ownerId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'ownerId es requerido.' })
  ownerId: string; // ID del usuario propietario

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción corta no puede estar vacía si está presente.' })
  shortDescription?: string; // Mapeado a 'descripcion_corta'

  @IsOptional()
  @IsString({ message: 'La descripción completa debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La descripción completa no puede estar vacía si está presente.' })
  fullDescription?: string; // Mapeado a 'descripcion_completa'

  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La dirección es requerida.' })
  address: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es requerido.' })
  // Si usas @IsPhoneNumber, asegúrate de que la librería 'libphonenumber-js' esté instalada y configurada
  // @IsPhoneNumber('AR', { message: 'El teléfono debe ser un número de teléfono válido para Argentina.' })
  phone: string;

  @IsString({ message: 'El WhatsApp debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El WhatsApp es requerido.' })
  // @IsPhoneNumber('AR', { message: 'El WhatsApp debe ser un número de teléfono válido para Argentina.' })
  whatsapp: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de Instagram debe ser una URL válida.' })
  instagramUrl?: string; // Mapeado a 'url_instagram'

  @IsOptional()
  @IsUrl({}, { message: 'La URL de Facebook debe ser una URL válida.' })
  facebookUrl?: string; // Mapeado a 'url_facebook'

  @IsOptional()
  @IsUrl({}, { message: 'La URL del sitio web debe ser una URL válida.' })
  websiteUrl?: string; // Mapeado a 'url_web'

  @IsOptional()
  @IsObject({ message: 'modulesConfig debe ser un objeto válido.' })
  @Type(() => Object) // Usar Type(() => Object) para objetos anidados simples
  modulesConfig?: ModulesConfig; // Mapeado a 'modulos_config'

  @IsOptional()
  @Type(() => Number) // IMPORTANTE: Transforma el string de la request a Number
  @Min(-90, { message: 'La latitud debe ser mayor o igual a -90.' })
  @Max(90, { message: 'La latitud debe ser menor o igual a 90.' })
  // Si usas @IsDecimal, necesitas importarlo y configurar los dígitos.
  // Pero si el campo en el DTO es 'number', los decoradores Min/Max son más adecuados.
  latitude?: number; // Mapeado a 'latitud' (Prisma espera Decimal, se convertirá en el servicio)

  @IsOptional()
  @Type(() => Number) // IMPORTANTE: Transforma el string de la request a Number
  @Min(-180, { message: 'La longitud debe ser mayor o igual a -180.' })
  @Max(180, { message: 'La longitud debe ser menor o igual a 180.' })
  // Si usas @IsDecimal, necesitas importarlo y configurar los dígitos.
  longitude?: number; // Mapeado a 'longitud' (Prisma espera Decimal, se convertirá en el servicio)
}