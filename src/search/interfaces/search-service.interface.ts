import { SearchableBusiness } from '@prisma/client';
import { CreateSearchableBusinessDto } from '../dtos/request/create-searchable-business.dto';
import { SearchBusinessDto } from '../dtos/request/search-business.dto';

export interface ISearchService {
  searchBusinesses(searchDto: SearchBusinessDto): Promise<{
    data: SearchResultBusiness[];
    total: number;
    skip: number;
    take: number;
  }>;

  searchBusinessesIds(ids: string[]): Promise<{data: SearchBusinessDto[]}>

}

export interface SearchResultBusiness {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  description?: string; // Podría ser shortDescription o fullDescription
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  categoryNames?: string[];
  tagNames?: string[];
  averageRating?: number;
  reviewCount?: number;
  status?: string;
  isOpenNow?: boolean;
  followersCount: number;
  // Puedes añadir más campos si los necesitas en la UI de búsqueda
}
