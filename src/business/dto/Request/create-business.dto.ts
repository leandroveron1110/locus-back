import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsPhoneNumber,
  IsUrl,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsDecimal,
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

  @IsUUID('4', { message: 'categoryId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'categoryId es requerido.' })
  categoryId: string; // ID de la categoría a la que pertenece el negocio

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
  // Puedes usar @IsPhoneNumber si tienes 'libphonenumber-js' instalado
  // @IsPhoneNumber('AR', { message: 'El teléfono debe ser un número de teléfono válido para Argentina.' })
  phone: string;

  @IsString({ message: 'El WhatsApp debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El WhatsApp es requerido.' })
  // @IsPhoneNumber('AR', { message: 'El WhatsApp debe ser un número de teléfono válido para Argentina.' }) // Si es un número
  whatsapp: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  email?: string;

  // IMPORTANTE: Según tu esquema, 'statusId' es OPCIONAL.
  // Si no se proporciona, Prisma usará el valor predeterminado si está definido en la base de datos (o será null).
  @IsOptional()
  @IsUUID('4', { message: 'statusId debe ser un UUID válido.' })
  statusId?: string; // ID del estado inicial del negocio (ej. "pending_review")

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
  @ValidateNested()
  @Type(() => Object) // Importante para que class-transformer intente validar el objeto anidado
  modulesConfig?: ModulesConfig; // Mapeado a 'modulos_config'

  @IsOptional()
  @Type(() => Number) // Convertir a número antes de validar
  // @IsDecimal({ decimal_digits: '0,7' }, { message: 'La latitud debe ser un número decimal con hasta 7 dígitos.' })
  // @Min(-90, { message: 'La latitud debe ser mayor o igual a -90.' })
  // @Max(90, { message: 'La latitud debe ser menor o igual a 90.' })
  latitude?: number; // Mapeado a 'latitud'

  @IsOptional()
  @Type(() => Number) // Convertir a número antes de validar
  // @IsDecimal({ decimal_digits: '0,7' }, { message: 'La longitud debe ser un número decimal con hasta 7 dígitos.' })
  // @Min(-180, { message: 'La longitud debe ser mayor o igual a -180.' })
  // @Max(180, { message: 'La longitud debe ser menor o igual a 180.' })
  longitude?: number; // Mapeado a 'longitud'

  // averageRating y ratingsCount son manejados por el sistema, no se crean directamente
}