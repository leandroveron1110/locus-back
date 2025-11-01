import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { BaseImageManager } from 'src/common/abstracts/base-image-manager.abstract';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { ImageType } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class UploadGlobalImageCommandHandler extends BaseImageManager {
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly prisma: PrismaService,
    protected readonly uploadsService: UploadsService,
    protected readonly logger: LoggingService,
  ) {
    super(imageService, uploadsService, prisma, logger);

    this.logger.setContext('UploadsImageGlobal');
    this.logger.setService(this.constructor.name);
  }

  /**
   * 📤 Comando: Subir y persistir una imagen global.
   */
  async uploadGlobalImage(
    file: Express.Multer.File,
    folderPath: string,
    imageType: ImageType = ImageType.GENERAL,
    name: string,
    altText: string,
    description: string,
    tags: string[],
  ): Promise<ImageResponseDto> {
    this.logger.debug('Starting global image upload (Command)', {
      fileName: file.originalname,
    });

    try {
      // Delegamos a la lógica compleja de la clase abstracta
      const image = await this.uploadAndPersistGlobalImage(
        file,
        imageType,
        folderPath,
        name,
        altText,
        description,
        tags,
      );
      this.logger.log('Global image uploaded successfully', {
        imageId: image.id,
      });
      return image;
    } catch (error) {
      this.logger.error('Failed to upload global image (Command)', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 🗑️ Comando: Eliminar una imagen global.
   */
  async removeGlobalImage(imageId: string): Promise<void> {
    this.logger.debug('Attempting to remove global image (Command)', {
      imageId,
    });

    const image = await this.imageService.findOne(imageId);
    if (!image) {
      this.logger.warn('Tried to remove a non-existent global image', {
        imageId,
      });
      throw new NotFoundException(`Global image ${imageId} not found`);
    }

    try {
      await this.removeImageAndMetadata(image.id, image.publicId, 'global');
      this.logger.log('Global image removed successfully', {
        imageId: image.id,
      });
    } catch (error) {
      this.logger.error('Failed to remove global image (Command)', {
        imageId,
        error: error.message,
      });
      throw error;
    }
  }

  // 🧱 Implementación de métodos abstractos (sin lógica para imágenes globales)
  protected async linkImageToEntity(): Promise<void> {
    return;
  }
  protected async unlinkImageFromEntity(): Promise<void> {
    return;
  }
  public async updateEntityImage(): Promise<ImageResponseDto> {
    throw new Error('Not implemented for global images');
  }
}
