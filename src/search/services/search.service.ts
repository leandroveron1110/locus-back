// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SearchableBusiness } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchBusinessDto } from '../dtos/request/search-business.dto';
import {
  ISearchService,
  SearchResultBusiness,
} from '../interfaces/search-service.interface';
import { WeeklyScheduleStructure } from '../types/WeeklySchedule';
import { toZonedTime } from 'date-fns-tz';
import { getDay } from 'date-fns';
import NewDate from 'src/common/validators/date';

@Injectable()
export class SearchService implements ISearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

async searchBusinesses(dto: SearchBusinessDto): Promise<{
  data: SearchResultBusiness[];
  total: number;
  skip: number;
  take: number;
}> {
  const {
    page = 1,
    limit = 20,
    openNow = true,
    query,
    city,
    province,
    categories,
    tags,
    lastSyncTime,
  } = dto;

  const skip = (page - 1) * limit;
  const take = limit;

  // ---------------------------------------------
  // 🟣 Caso 1: hay lastSyncTime → búsqueda incremental
  // ---------------------------------------------
  if (lastSyncTime) {
    const params: any[] = [new Date(lastSyncTime)];
    let paramIndex = 2; // $1 ya está usado por lastSyncTime

    let whereClause = `WHERE "fecha_ultima_sincronizacion" > $1`;

    if (query) {
      whereClause += `
        AND (
          unaccent("nombre") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR unaccent("descripcion_corta") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR unaccent("descripcion_completa") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR unaccent("direccion") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR unaccent("ciudad") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR unaccent("provincia") ILIKE unaccent('%' || $${paramIndex} || '%')
          OR EXISTS (
            SELECT 1 FROM unnest("nombres_categorias") AS c
            WHERE unaccent(c) ILIKE unaccent('%' || $${paramIndex} || '%')
          )
          OR EXISTS (
            SELECT 1 FROM unnest("nombres_tags") AS t
            WHERE unaccent(t) ILIKE unaccent('%' || $${paramIndex} || '%')
          )
        )
      `;
      params.push(query);
      paramIndex++;
    }

    if (city) {
      whereClause += ` AND unaccent("ciudad") ILIKE unaccent('%' || $${paramIndex} || '%')`;
      params.push(city);
      paramIndex++;
    }
    if (province) {
      whereClause += ` AND unaccent("provincia") ILIKE unaccent('%' || $${paramIndex} || '%')`;
      params.push(province);
      paramIndex++;
    }
    if (categories?.length) {
      whereClause += ` AND "nombres_categorias" && $${paramIndex}`;
      params.push(categories);
      paramIndex++;
    }
    if (tags?.length) {
      whereClause += ` AND "nombres_tags" && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    const selectQuery = `
      SELECT 
        id, nombre AS "name", descripcion_corta AS "shortDescription",
        descripcion_completa AS "fullDescription", direccion AS "address",
        ciudad AS "city", provincia AS "province", nombres_categorias AS "categoryNames",
        nombres_tags AS "tagNames", latitud AS "latitude", longitud AS "longitude",
        promedio_calificacion AS "averageRating", cantidad_calificaciones AS "reviewCount",
        estado AS "status", url_logo AS "logoUrl", horarios,
        modulos_config AS "modulesConfig", fecha_creacion_original AS "createdAt",
        fecha_ultima_sincronizacion AS "updatedAt", cantidad_seguidores AS "followersCount"
      FROM "negocios_busqueda"
      ${whereClause}
      ORDER BY "fecha_ultima_sincronizacion" DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `SELECT COUNT(*)::int AS count FROM "negocios_busqueda" ${whereClause}`;

    const [businesses, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<SearchableBusiness[]>(selectQuery, ...params, take, skip),
      this.prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...params),
    ]);

    const total = countResult[0]?.count || 0;
    const data = this.formatBusinesses(businesses, openNow);
    return { data, total, skip, take };
  }

  // ---------------------------------------------
  // 🟡 Caso 2: búsqueda normal con query (sin lastSyncTime)
  // ---------------------------------------------
  if (query) {
    const whereClause = `
      WHERE
        unaccent("nombre") ILIKE unaccent('%' || $1 || '%')
        OR unaccent("descripcion_corta") ILIKE unaccent('%' || $1 || '%')
        OR unaccent("descripcion_completa") ILIKE unaccent('%' || $1 || '%')
        OR unaccent("direccion") ILIKE unaccent('%' || $1 || '%')
        OR unaccent("ciudad") ILIKE unaccent('%' || $1 || '%')
        OR unaccent("provincia") ILIKE unaccent('%' || $1 || '%')
        OR EXISTS (
          SELECT 1 FROM unnest("nombres_categorias") AS c
          WHERE unaccent(c) ILIKE unaccent('%' || $1 || '%')
        )
        OR EXISTS (
          SELECT 1 FROM unnest("nombres_tags") AS t
          WHERE unaccent(t) ILIKE unaccent('%' || $1 || '%')
        )
    `;

    const rawQuery = `
      SELECT 
        id, nombre AS "name", descripcion_corta AS "shortDescription",
        descripcion_completa AS "fullDescription", direccion AS "address",
        ciudad AS "city", provincia AS "province", nombres_categorias AS "categoryNames",
        nombres_tags AS "tagNames", latitud AS "latitude", longitud AS "longitude",
        promedio_calificacion AS "averageRating", cantidad_calificaciones AS "reviewCount",
        estado AS "status", url_logo AS "logoUrl", horarios,
        modulos_config AS "modulesConfig", fecha_creacion_original AS "createdAt",
        fecha_ultima_sincronizacion AS "updatedAt", cantidad_seguidores AS "followersCount"
      FROM "negocios_busqueda"
      ${whereClause}
      ORDER BY "promedio_calificacion" DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `SELECT COUNT(*)::int AS count FROM "negocios_busqueda" ${whereClause}`;

    const [allBusinesses, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<SearchableBusiness[]>(rawQuery, query, take, skip),
      this.prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, query),
    ]);

    const total = countResult[0]?.count || 0;
    const data = this.formatBusinesses(allBusinesses, openNow);
    return { data, total, skip, take };
  }

  // ---------------------------------------------
  // 🟢 Caso 3: sin query, sin lastSyncTime → Prisma ORM directo
  // ---------------------------------------------
  const where = this.buildWhere(dto, true);

  const [total, businesses] = await Promise.all([
    this.prisma.searchableBusiness.count({ where }),
    this.prisma.searchableBusiness.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data = this.formatBusinesses(businesses, openNow);
  return { data, total, skip, take };
}



  // async searchBusinesses(dto: SearchBusinessDto): Promise<{
  //   data: SearchResultBusiness[];
  //   total: number;
  //   skip: number;
  //   take: number;
  // }> {
  //   const {
  //     page = 1,
  //     limit = 20,
  //     openNow = true,
  //     query,
  //     city,
  //     province,
  //     categories,
  //     tags,
  //     lastSyncTime
  //   } = dto;
  //   const skip = (page - 1) * limit;
  //   const take = limit;

  //   // Si hay búsqueda con query => usamos SQL crudo para categorías/tags parciales
  //   if (query) {
  //     const rawQuery = `
  //       SELECT 
  //         id,
  //         nombre AS "name",
  //         descripcion_corta AS "shortDescription",
  //         descripcion_completa AS "fullDescription",
  //         direccion AS "address",
  //         ciudad AS "city",
  //         provincia AS "province",
  //         nombres_categorias AS "categoryNames",
  //         nombres_tags AS "tagNames",
  //         latitud AS "latitude",
  //         longitud AS "longitude",
  //         promedio_calificacion AS "averageRating",
  //         cantidad_calificaciones AS "reviewCount",
  //         estado AS "status",
  //         url_logo AS "logoUrl",
  //         horarios,
  //         modulos_config AS "modulesConfig",
  //         fecha_creacion_original AS "createdAt",
  //         fecha_ultima_sincronizacion AS "updatedAt",
  //         cantidad_seguidores AS "followersCount"
  //       FROM "negocios_busqueda"
  //       WHERE
  //         "nombre" ILIKE '%' || $1 || '%'
  //         OR "descripcion_corta" ILIKE '%' || $1 || '%'
  //         OR "descripcion_completa" ILIKE '%' || $1 || '%'
  //         OR "direccion" ILIKE '%' || $1 || '%'
  //         OR "ciudad" ILIKE '%' || $1 || '%'
  //         OR "provincia" ILIKE '%' || $1 || '%'
  //         OR EXISTS (
  //           SELECT 1
  //           FROM unnest("nombres_categorias") AS c
  //           WHERE c ILIKE '%' || $1 || '%'
  //         )
  //         OR EXISTS (
  //           SELECT 1
  //           FROM unnest("nombres_tags") AS t
  //           WHERE t ILIKE '%' || $1 || '%'
  //         )
  //     `;

  //     const allBusinesses: SearchableBusiness[] =
  //       await this.prisma.$queryRawUnsafe(rawQuery, query);

  //     const total = allBusinesses.length;
  //     const paginated = allBusinesses.slice(skip, skip + take);
  //     const data = this.formatBusinesses(paginated, openNow);

  //     return { data, total, skip, take };
  //   }

  //   // Si no hay query => usamos Prisma normal (más optimizado para filtros exactos)
  //   const where = this.buildWhere(dto, true);

  //   const [total, businesses] = await Promise.all([
  //     this.prisma.searchableBusiness.count({ where }),
  //     this.prisma.searchableBusiness.findMany({
  //       where,
  //       skip,
  //       take,
  //       orderBy: { createdAt: 'desc' },
  //     }),
  //   ]);

  //   const data = this.formatBusinesses(businesses, openNow);
  //   return { data, total, skip, take };
  // }


  async searchBusinessesIds(ids: string[]): Promise<{
    data: SearchResultBusiness[];
  }> {
    const businesses = await this.prisma.searchableBusiness.findMany({
      where: {
      id: {
        in: ids,
      },
    },
      orderBy: { createdAt: 'desc' },
    });


    const data = this.formatBusinesses(businesses, true);
    return { data };
  }

  // ---------------- Helpers ----------------

  private buildWhere(
    dto: SearchBusinessDto,
    includeArrayFilters = true,
  ): Prisma.SearchableBusinessWhereInput {
    const { city, province, categories, tags } = dto;
    const where: Prisma.SearchableBusinessWhereInput = {};

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (province) where.province = { contains: province, mode: 'insensitive' };
    if (includeArrayFilters) {
      if (categories?.length) where.categoryNames = { hasSome: categories };
      if (tags?.length) where.tagNames = { hasSome: tags };
    }

    return where;
  }

  private formatBusinesses(
    businesses: SearchableBusiness[],
    openNow?: boolean,
  ): SearchResultBusiness[] {
    return businesses.map((sb) => ({
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
      followersCount: sb.followersCount,
      isOpenNow: openNow ? this.checkIfBusinessIsOpenNow(sb.horarios) : false,
    }));
  }

  private checkIfBusinessIsOpenNow(
    horariosJson: Prisma.JsonValue | null,
  ): boolean {
    if (!horariosJson) return false;
    try {
      const schedules: WeeklyScheduleStructure =
        typeof horariosJson === 'string'
          ? JSON.parse(horariosJson)
          : (horariosJson as WeeklyScheduleStructure);

      const nowInArgentina = NewDate()

      // Mapea el día de la semana (0=Domingo, 1=Lunes, etc.) a la clave del JSON
      const daysOfWeek = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];
      const currentDay = daysOfWeek[getDay(nowInArgentina)];

      const currentTimeMinutes =
        nowInArgentina.getHours() * 60 + nowInArgentina.getMinutes();
      const todayScheduleRanges = schedules[currentDay];

      if (!todayScheduleRanges || todayScheduleRanges.length === 0) {
        return false;
      }

      for (const timeRange of todayScheduleRanges) {
        if (timeRange === 'Cerrado') continue;

        const [openTimeStr, closeTimeStr] = timeRange.split('-');
        if (!openTimeStr || !closeTimeStr) continue;

        const [openHour, openMinute] = openTimeStr.split(':').map(Number);
        const [closeHour, closeMinute] = closeTimeStr.split(':').map(Number);

        const totalOpenMinutes = openHour * 60 + openMinute;
        const totalCloseMinutes = closeHour * 60 + closeMinute;

        if (totalCloseMinutes <= totalOpenMinutes) {
          if (
            currentTimeMinutes >= totalOpenMinutes ||
            currentTimeMinutes <= totalCloseMinutes
          ) {
            return true;
          }
        } else {
          if (
            currentTimeMinutes >= totalOpenMinutes &&
            currentTimeMinutes <= totalCloseMinutes
          ) {
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      this.logger.error(
        `Error en checkIfBusinessIsOpenNow: ${e.message}`,
        e.stack,
      );
      return false;
    }
  }
}
