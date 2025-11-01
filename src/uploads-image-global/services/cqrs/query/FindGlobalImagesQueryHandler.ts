import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class FindGlobalImagesQueryHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UploadsGlobalQuery');
    this.logger.setService(this.constructor.name);
  }

  async execute(): Promise<
    {
      id: string;
      name: string;
      altText: string | null;
      description: string | null;
      tags: string[];
      url: string;
    }[]
  > {
    this.logger.debug('Fetching all global images (Query)...');

    try {
      // Se asume que las imágenes globales se marcan con isCustomizedImage: true
      const images = await this.prisma.image.findMany({
        where: {
          isCustomizedImage: true,
        },
        select: {
          id: true,
          url: true,
          name: true,
          description: true,
          tags: true,
          altText: true,
        },
        orderBy: {
          createdAt: 'desc',
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
