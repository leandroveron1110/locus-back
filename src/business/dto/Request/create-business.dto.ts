// src/business/dto/Request/create-business.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsUrl,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Interfaces para modulesConfig ---
export interface ModuleConfigEntry {
  enabled: boolean;
  url?: string;
}

export interface ModulesConfig {
  weeklySchedule?: ModuleConfigEntry;
  offeredServices?: ModuleConfigEntry;
  products?: ModuleConfigEntry;
  menu?: ModuleConfigEntry;
  events?: ModuleConfigEntry;
}
// --- Fin de interfaces ---

export class CreateBusinessDto {
  // --- Datos básicos ---
  @IsUUID('4', { message: 'ownerId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'ownerId es requerido.' })
  ownerId: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción corta debe ser una cadena de texto.' })
  shortDescription?: string;

  @IsOptional()
  @IsString({ message: 'La descripción completa debe ser una cadena de texto.' })
  fullDescription?: string;

  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La dirección es requerida.' })
  address: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El teléfono es requerido.' })
  phone: string;

  @IsString({ message: 'El WhatsApp debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El WhatsApp es requerido.' })
  whatsapp: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección válida.' })
  email?: string;

  // --- URLs opcionales ---
  @IsOptional()
  @IsUrl({}, { message: 'La URL de Instagram debe ser válida.' })
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL de Facebook debe ser válida.' })
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del sitio web debe ser válida.' })
  websiteUrl?: string;

  // --- Configuración modular ---
  @IsOptional()
  @IsObject({ message: 'modulesConfig debe ser un objeto válido.' })
  @ValidateNested()
  @Type(() => Object)
  modulesConfig?: ModulesConfig;

  // --- Geolocalización ---
  @IsOptional()
  @Type(() => Number)
  @Min(-90, { message: 'La latitud debe ser >= -90.' })
  @Max(90, { message: 'La latitud debe ser <= 90.' })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(-180, { message: 'La longitud debe ser >= -180.' })
  @Max(180, { message: 'La longitud debe ser <= 180.' })
  longitude?: number;

  // --- Configuración general de formas de pago ---
  @IsBoolean({ message: 'acceptsCash debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsCash: boolean = true;

  @IsBoolean({ message: 'acceptsTransfer debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsTransfer: boolean = true;

  @IsBoolean({ message: 'acceptsQr debe ser un valor booleano.' })
  @Type(() => Boolean)
  acceptsQr: boolean = false;
}