import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';
const sharp = require('sharp');

@Injectable()
export class ImageProcessingService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setService(this.constructor.name);
    this.logger.setContext('Uploads');
  }

  /**
   * Procesa el buffer de una imagen:
   * 1. Redimensiona a un tamaño razonable (opcional).
   * 2. Lo convierte al formato WebP optimizado para la web.
   * @param fileBuffer El Buffer de la imagen original.
   * @returns Una promesa que resuelve con el Buffer de la imagen procesada.
   */
  async processImageToWebP(fileBuffer: Buffer): Promise<Buffer> {
    this.logger.debug('Starting image processing: converting to WebP.');

    // Configuraciones de procesamiento (puedes hacerlas configurables)
    const MAX_WIDTH = 1200;
    const QUALITY = 80;

    try {
      const processedBuffer = await sharp(fileBuffer)
        .resize(MAX_WIDTH, undefined, {
          // Redimensiona a MAX_WIDTH manteniendo el ratio
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY }) // Convierte a WebP con calidad 80
        .toBuffer();

      this.logger.log(
        `Image successfully processed. Size change: ${fileBuffer.length} bytes -> ${processedBuffer.length} bytes.`,
      );

      return processedBuffer;
    } catch (error) {
      this.logger.error(
        `Image processing failed: ${error.message}`,
        error.stack,
      );
      // Lanzamos un error estándar que puede ser capturado
      throw new Error(`Failed to process image with Sharp: ${error.message}`);
    }
  }
}
