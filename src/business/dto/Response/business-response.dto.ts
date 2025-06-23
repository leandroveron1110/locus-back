import { Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from 'src/categories/dto/Response/category-response.dto';
import { TagResponseDto } from 'src/targs/dto/Response/tag-response.dto';

export class BusinessResponseDto {
  @Expose()
  id: string;

  @Expose()
  ownerId: string;

  @Expose()
  name: string;

  @Expose()
  categoryId: string;

  @Expose()
  shortDescription?: string;

  @Expose()
  fullDescription?: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  whatsapp: string;

  @Expose()
  email?: string;

  @Expose()
  logoUrl?: string;

  @Expose()
  galleryUrls?: string[];

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  instagramUrl?: string;

  @Expose()
  facebookUrl?: string;

  @Expose()
  websiteUrl?: string;

  @Expose()
  modulesConfig?: Record<string, any>;

  @Expose()
  latitude?: number;

  @Expose()
  longitude?: number;

  @Expose()
  averageRating?: number;

  @Expose()
  ratingsCount?: number;

  // --- Relaciones ---
  @Expose()
  @Type(() => CategoryResponseDto) // Transforma el objeto Category a CategoryResponseDto
  category?: CategoryResponseDto; // Incluye la información completa de la categoría

  @Expose()
  @Type(() => TagResponseDto) // Transforma los objetos Tag a TagResponseDto
  tags?: TagResponseDto[]; // Incluye la información completa de los tags

  // Puedes añadir más relaciones aquí si necesitas exponerlas directamente en la respuesta del negocio:
  // @Expose()
  // @Type(() => WeeklyScheduleResponseDto)
  // weeklySchedules?: WeeklyScheduleResponseDto[];
}