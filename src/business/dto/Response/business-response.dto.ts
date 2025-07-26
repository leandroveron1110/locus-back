import { Business as PrismaBusiness } from '@prisma/client'; // Importa el tipo Business de Prisma

export interface ModuleConfigEntry {
  enabled: boolean;
  url?: string;
  // Agrega aquí otras configuraciones específicas del módulo si son necesarias
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



export class BusinessResponseDto {
  id: string;
  ownerId: string; // El ID del propietario
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  address: string;
  phone: string;
  whatsapp: string;
  email?: string;
  statusId?: string; // ID del estado actual (opcional según tu esquema)
  createdAt: Date;
  updatedAt: Date;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  modulesConfig: ModulesConfig | Record<string, never>; // Puede ser ModulesConfig o un objeto vacío {}
  latitude?: number | null; // Decimal se mapea a number, pero puede ser null
  longitude?: number | null; // Decimal se mapea a number, pero puede ser null
  averageRating?: number | null; // Decimal se mapea a number, puede ser null
  ratingsCount?: number; // Int se mapea a number

  // Método estático para transformar un objeto Prisma Business a este DTO
  static fromPrisma(business: PrismaBusiness): BusinessResponseDto {
    const dto = new BusinessResponseDto();
    dto.id = business.id;
    dto.ownerId = business.ownerId; // Mapea de ownerId en Prisma
    dto.name = business.name;
    dto.shortDescription = business.shortDescription ?? undefined;
    dto.fullDescription = business.fullDescription ?? undefined;
    dto.address = business.address;
    dto.phone = business.phone;
    dto.whatsapp = business.whatsapp;
    dto.email = business.email ?? undefined;
    dto.statusId = business.statusId ?? undefined; // Mapea de statusId en Prisma
    dto.createdAt = business.createdAt;
    dto.updatedAt = business.updatedAt;
    dto.instagramUrl = business.instagramUrl ?? undefined;
    dto.facebookUrl = business.facebookUrl ?? undefined;
    dto.websiteUrl = business.websiteUrl ?? undefined;
    dto.logoUrl = "";
    
    // Asegúrate de que modulesConfig sea un objeto. Si es null en DB, usa un objeto vacío.
    dto.modulesConfig = (business.modulesConfig as ModulesConfig) || {};

    // Prisma devuelve Decimal como un objeto Decimal.js o un string dependiendo de la configuración.
    // Para asegurar que sea un number o null, convertimos:
    dto.latitude = business.latitude !== null ? Number(business.latitude) : null;
    dto.longitude = business.longitude !== null ? Number(business.longitude) : null;
    dto.averageRating = business.averageRating !== null ? Number(business.averageRating) : null;
    dto.ratingsCount = business.ratingsCount ?? undefined; // int puede ser null si no tiene default

    return dto;
  }
}


// Define tipos para las relaciones mínimas que quieres exponer
type CategorySimple = { id: string; name: string };
type TagSimple = { id: string; name: string };
type GalleryImageSimple = { id: string; url: string };

export class BusinessProfileResponseDto {
  id: string;
  ownerId: string;
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  address: string;
  phone: string;
  whatsapp: string;
  email?: string;
  statusId?: string;
  createdAt: Date;
  updatedAt: Date;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  modulesConfig: ModulesConfig | Record<string, never>;
  latitude?: number | null;
  longitude?: number | null;
  averageRating?: number | null;
  ratingsCount?: number;
  weeklySchedule: Record<string, string[]>

  // Campos nuevos para categorías, tags y galería
  categories?: CategorySimple[];
  tags?: TagSimple[];
  gallery?: GalleryImageSimple[];

  // Método para transformar negocio + relaciones a DTO limpio
  static fromPrismaWithRelations(params: {
    business: PrismaBusiness,
    logo?: { id: string; url: string } | null,
    categories?: { category: { id: string; name: string } }[],
    tags?: { tag: { id: string; name: string } }[],
    gallery?: { id: string; url: string }[],
    weeklySchedule: Record<string, string[]>
  }): BusinessProfileResponseDto {
    const { business, logo, categories, tags, gallery, weeklySchedule } = params;

    const dto = new BusinessProfileResponseDto();

    dto.id = business.id;
    dto.ownerId = business.ownerId;
    dto.name = business.name;
    dto.shortDescription = business.shortDescription ?? undefined;
    dto.fullDescription = business.fullDescription ?? undefined;
    dto.address = business.address;
    dto.phone = business.phone;
    dto.whatsapp = business.whatsapp;
    dto.email = business.email ?? undefined;
    dto.statusId = business.statusId ?? undefined;
    dto.createdAt = business.createdAt;
    dto.updatedAt = business.updatedAt;
    dto.instagramUrl = business.instagramUrl ?? undefined;
    dto.facebookUrl = business.facebookUrl ?? undefined;
    dto.websiteUrl = business.websiteUrl ?? undefined;
    dto.logoUrl = logo?.url ?? undefined;
    dto.modulesConfig = (business.modulesConfig as ModulesConfig) || {};
    dto.latitude = business.latitude !== null ? Number(business.latitude) : null;
    dto.longitude = business.longitude !== null ? Number(business.longitude) : null;
    dto.averageRating = business.averageRating !== null ? Number(business.averageRating) : null;
    dto.ratingsCount = business.ratingsCount ?? undefined;

    // Mapea categorías para devolver solo id y nombre
    dto.categories = categories?.map(c => ({
      id: c.category.id,
      name: c.category.name,
    })) || [];

    // Mapea tags para devolver solo id y nombre
    dto.tags = tags?.map(t => ({
      id: t.tag.id,
      name: t.tag.name,
    })) || [];

    // Mapea galería con id y url
    dto.gallery = gallery?.map(g => ({
      id: g.id,
      url: g.url,
    })) || [];

    dto.weeklySchedule = weeklySchedule

    return dto;
  }
}



export class BusinessPreviewDto {
  id: string;
  name: string;
  shortDescription?: string;
  averageRating?: number | null;
  ratingsCount?: number;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;

  static fromPrisma(business: PrismaBusiness): BusinessPreviewDto {
    const dto = new BusinessPreviewDto();
    dto.id = business.id;
    dto.name = business.name;
    dto.shortDescription = business.shortDescription ?? undefined;
    dto.averageRating = business.averageRating !== null ? Number(business.averageRating) : null;
    dto.ratingsCount = business.ratingsCount ?? undefined;
    dto.instagramUrl = business.instagramUrl ?? undefined;
    dto.facebookUrl = business.facebookUrl ?? undefined;
    dto.websiteUrl = business.websiteUrl ?? undefined;
    return dto;
  }
}