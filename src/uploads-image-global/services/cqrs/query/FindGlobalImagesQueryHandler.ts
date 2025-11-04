import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggingService } from 'src/logging/logging.service';
import { Prisma } from '@prisma/client';
import { FindGlobalImagesQueryDto } from 'src/uploads-image-global/dto/request/search-global-image.dto';
import { GlobalImage } from 'src/uploads-image-global/dto/response/search-global-image.dto';

@Injectable()
export class FindGlobalImagesQueryHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UploadsGlobalQuery');
    this.logger.setService(this.constructor.name);
  }

  async execute(queryDto: FindGlobalImagesQueryDto): Promise<GlobalImage[]> {
    const { lastSyncTime, query } = queryDto;

    // 1. Condición base: Solo imágenes marcadas como globales
    let whereCondition: Prisma.ImageWhereInput = {
      isCustomizedImage: true,
    };
    let logMessage = 'Fetching global images...';

    // ----------------------------------------------------
    // 🟢 2. Aplicar Búsqueda Textual (QUERY) si está presente
    // Esto define el CONJUNTO de imágenes que estamos buscando.
    // ----------------------------------------------------
    if (query) {
      logMessage = `Filtering by query: "${query}".`;

      // Creamos la condición OR para la búsqueda en name, altText, description y tags.
      const queryFilter: Prisma.ImageWhereInput['OR'] = [
        { name: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ];

      // Combinamos la condición base con la condición de búsqueda mediante AND
      whereCondition = {
        ...whereCondition,
        OR: queryFilter,
      };
    }

    // ----------------------------------------------------
    // 🟣 3. Aplicar Sincronización Incremental (LASTSYNCTIME) si está presente
    // Esto reduce el conjunto de imágenes (ya filtrado por query) solo a las modificadas.
    // ----------------------------------------------------
    if (lastSyncTime) {
      const lastSyncDate = new Date(lastSyncTime);
      logMessage += ` Applying incremental sync after ${lastSyncTime}.`;

      // Agregamos la condición de updatedAT al whereCondition principal.
      whereCondition.updatedAt = {
        gt: lastSyncDate,
      };
    }

    this.logger.debug(logMessage);

    try {
      const images: GlobalImage[] = await this.prisma.image.findMany({
        where: whereCondition,
        select: {
          id: true,
          url: true,
          name: true,
          description: true,
          tags: true,
          altText: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      this.logger.log(`Found ${images.length} global images.`);
      return images;
    } catch (error) {
      this.logger.error('Failed to fetch global images (Query)', {
        error: error.message,
      });
      throw error;
    }
  }
}
