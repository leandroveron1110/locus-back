// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SearchableBusiness } from '@prisma/client'; // Importa Prisma para tipos y Prisma.Decimal
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchBusinessDto } from '../dtos/request/search-business.dto';
import { CreateSearchableBusinessDto } from '../dtos/request/create-searchable-business.dto';
import { ISearchService, SearchResultBusiness } from '../interfaces/search-service.interface';

// Define la interfaz de resultados de búsqueda para la consistencia


@Injectable()
export class SearchService implements ISearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchBusinesses(searchDto: SearchBusinessDto): Promise<{
    data: SearchResultBusiness[];
    total: number;
    skip: number;
    take: number;
  }> {
    const {
      q, // Término de búsqueda general
      categoryId, // Este asume que es el NOMBRE de la categoría para buscar en categoryNames
      city,
      province,
      tags, // Array de nombres de tags
      latitude,
      longitude,
      radiusKm,
      openNow,
      minRating,
      skip = 0, // Valores por defecto
      take = 10, // Valores por defecto
      filters, // JSON para filtros de módulos
      orderBy,
    } = searchDto;

    const where: Prisma.SearchableBusinessWhereInput = {
      // Por defecto, solo busca negocios activos (si tu modelo SearchableBusiness tiene un campo 'status' mapeado a 'estado')
      status: { equals: 'ACTIVE' }, // Asegúrate de que 'ACTIVE' es el nombre del estado para negocios activos
    };
    const orderByClause: Prisma.SearchableBusinessOrderByWithRelationInput = {};

    // 1. Búsqueda por término general (q)
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { fullDescription: { contains: q, mode: 'insensitive' } },
        { categoryNames: { has: q } }, // Busca si el array contiene el término
        { tagNames: { has: q } }, // Busca si el array contiene el término
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { province: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 2. Filtro por categoría (usando categoryNames)
    // Asume que `categoryId` en el DTO es el NOMBRE de la categoría que quieres filtrar.
    // Si tu front-end envía IDs, necesitarás una forma de mapear esos IDs a nombres de categoría
    // o almacenar los IDs en `SearchableBusiness` también.
    if (categoryId) {
      where.categoryNames = { has: categoryId };
    }

    // 3. Filtro por ubicación (ciudad/provincia)
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (province) {
      where.province = { contains: province, mode: 'insensitive' };
    }

    // 4. Búsqueda por tags
    if (tags && tags.length > 0) {
      where.tagNames = { hasEvery: tags }; // Busca que contenga TODOS los tags especificados
    }

    // 5. Búsqueda por proximidad
    if (latitude && longitude && radiusKm) {
      // Esta es una aproximación simple de "bounding box".
      // Para una búsqueda espacial más precisa, PostGIS es ideal,
      // pero requeriría funciones SQL directas o una librería ORM con soporte Geo.
      // Para Prisma, necesitas calcular los límites de latitud/longitud.
      const latDelta = radiusKm / 111.0; // Aproximadamente 111 km por grado de latitud
      const lonDelta =
        radiusKm / (111.0 * Math.cos((latitude * Math.PI) / 180)); // Ajuste por longitud

      where.latitude = {
        gte: new Prisma.Decimal(latitude - latDelta),
        lte: new Prisma.Decimal(latitude + latDelta),
      };
      where.longitude = {
        gte: new Prisma.Decimal(longitude - lonDelta),
        lte: new Prisma.Decimal(longitude + lonDelta),
      };
    }

    // 6. Filtro por calificación mínima
    if (minRating) {
      where.averageRating = { gte: new Prisma.Decimal(minRating) };
    }

    // 7. Filtro `openNow`
    // Como mencionamos antes, filtrar por `openNow` directamente en la DB con Prisma y JSONB
    // es complejo para rangos de tiempo y zonas horarias.
    // La estrategia más común es:
    // a) Traer todos los negocios que tengan horarios definidos (`horarios` no es nulo).
    // b) Filtrar los resultados en memoria en el servicio/aplicación.
    // O usar un motor de búsqueda externo como ElasticSearch/Solr/Meilisearch.
    if (openNow) {
      where.horarios = { not: Prisma.JsonNull }; // Asegura que el campo horarios exista
    }

    // 8. Filtros JSON genéricos para `modulesConfig`
    if (filters) {
      try {
        const parsedFilters = JSON.parse(filters);
        // Ejemplo: Si el cliente envía `filters={"ecommerce":true}`
        if (typeof parsedFilters.ecommerce === 'boolean') {
          where.modulesConfig = {
            path: ['ecommerce', 'activo'], // Ruta en el JSON: modulesConfig.ecommerce.activo
            equals: parsedFilters.ecommerce,
          };
        }
        // Puedes añadir más lógica para otros filtros aquí:
        // if (typeof parsedFilters.bookingsEnabled === 'boolean') {
        //   where.modulesConfig = {
        //     path: ['bookings', 'enabled'],
        //     equals: parsedFilters.bookingsEnabled,
        //   };
        // }
      } catch (e) {
        this.logger.error(`Error parsing filters JSON: ${e.message}`);
        // Considera lanzar una excepción BadRequest si el JSON es inválido
      }
    }

    // 9. Ordenamiento
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      if (field && ['asc', 'desc'].includes(direction.toLowerCase())) {
        // Asegúrate de que los campos existan en SearchableBusiness
        if (['name', 'averageRating', 'createdAt'].includes(field)) {
          orderByClause[field] = direction.toLowerCase() as Prisma.SortOrder;
        } else {
          this.logger.warn(
            `Campo de ordenamiento inválido para SearchableBusiness: ${field}. Ignorando.`,
          );
        }
      } else {
        this.logger.warn(
          `Formato de ordenamiento inválido: ${orderBy}. Debe ser "campo:direccion". Ignorando.`,
        );
      }
    } else {
      // Ordenamiento por defecto si no se especifica
      orderByClause.name = 'asc';
    }

    this.logger.debug(
      `Final WHERE clause for SearchableBusiness: ${JSON.stringify(where)}`,
    );
    this.logger.debug(
      `Final ORDER BY clause for SearchableBusiness: ${JSON.stringify(orderByClause)}`,
    );

    const [searchableBusinesses, total] = await this.prisma.$transaction([
      this.prisma.searchableBusiness.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: orderByClause,
      }),
      this.prisma.searchableBusiness.count({ where }),
    ]);

    // 10. Mapear resultados y aplicar lógica de `isOpenNow` si es necesario
    const formattedBusinesses: SearchResultBusiness[] =
      searchableBusinesses.map((sb) => {
        // Clona el objeto para evitar mutaciones directas y facilitar la conversión
        const result: SearchResultBusiness = {
          id: sb.id,
          name: sb.name,
          address: sb.address ?? undefined,
          city: sb.city ?? undefined,
          province: sb.province ?? undefined,
          description: sb.shortDescription ?? sb.fullDescription ?? undefined,
          latitude: sb.latitude?.toNumber() ?? undefined,
          longitude: sb.longitude?.toNumber() ?? undefined,
          logoUrl: sb.logoUrl ?? undefined,
          categoryNames: sb.categoryNames || [],
          tagNames: sb.tagNames || [],
          averageRating: sb.averageRating?.toNumber() ?? undefined,
          reviewCount: sb.reviewCount ?? 0,
          status: sb.status ?? undefined,
          // Default a false si openNow no se solicitó o si la comprobación falla
          isOpenNow: openNow
            ? this.checkIfBusinessIsOpenNow(sb.horarios)
            : false,
        };
        return result;
      });

    return {
      data: formattedBusinesses,
      total,
      skip: Number(skip),
      take: Number(take),
    };
  }

  // --- Helpers para la lógica de horarios ---
  private getCurrentDayOfWeek(): string {
    // Retorna el día de la semana en formato de texto completo (ej. "MONDAY")
    const now = new Date();
    // En JS, getDay() 0=Sunday, 1=Monday...
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[now.getDay()];
  }

  private checkIfBusinessIsOpenNow(
    horariosJson: Prisma.JsonValue | null,
  ): boolean {
    if (!horariosJson) {
      return false; // No hay horarios definidos
    }

    try {
      const schedules = horariosJson as Record<string, string>; // Asume el formato { "MONDAY": "09:00-18:00", ... }
      const now = new Date();
      const currentDay = this.getCurrentDayOfWeek(); // Ej: "WEDNESDAY"
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Hora actual en minutos desde medianoche

      const todaySchedule = schedules[currentDay];

      if (!todaySchedule || todaySchedule === 'Cerrado') {
        return false;
      }

      const [openTimeStr, closeTimeStr] = todaySchedule.split('-');
      if (!openTimeStr || !closeTimeStr) {
        this.logger.warn(
          `Formato de horario inválido para ${currentDay}: ${todaySchedule}`,
        );
        return false;
      }

      const [openHour, openMinute] = openTimeStr.split(':').map(Number);
      let totalOpenMinutes = openHour * 60 + openMinute;

      const [closeHour, closeMinute] = closeTimeStr.split(':').map(Number);
      let totalCloseMinutes = closeHour * 60 + closeMinute;

      // Manejo de horarios que cruzan la medianoche (ej. 22:00-02:00)
      if (totalCloseMinutes < totalOpenMinutes) {
        // Si la hora de cierre es anterior a la de apertura, significa que cruza la medianoche.
        // Se asume que el cierre es al día siguiente.
        // Si la hora actual está antes de la apertura, pero después de la medianoche,
        // la consideramos parte del día de apertura (ej. 01:00 AM para un cierre a las 02:00 AM).
        if (currentTime < totalOpenMinutes) {
          totalOpenMinutes -= 24 * 60; // Ajustamos el inicio para que quede antes de medianoche del día anterior
        } else {
          totalCloseMinutes += 24 * 60; // Ajustamos el cierre para que quede en el día siguiente
        }
      }
      // Para simplificar, si la hora actual está entre el rango (ajustado si es necesario)
      return (
        currentTime >= totalOpenMinutes && currentTime <= totalCloseMinutes
      );
    } catch (e) {
      this.logger.error(
        `Error en checkIfBusinessIsOpenNow: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
