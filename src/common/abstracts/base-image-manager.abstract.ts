// src/common/abstracts/base-image-manager.abstract.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { UploadResult } from 'src/uploads/interfaces/storage-provider.interface';
import { TOKENS } from '../constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { ImageType } from '@prisma/client';
@Injectable()
export abstract class BaseImageManager {
  protected readonly logger: Logger;

  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly uploadsService: UploadsService,
    protected readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.prisma = prisma;
  }

  protected async uploadAndPersistImage(
    file: Express.Multer.File,
    imageType: ImageType,
    folderPath: string,
    isCustomizedImage: boolean
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `[BaseImageManager] Starting upload and persist for image type: ${imageType} in folder: ${folderPath}.`,
    );

    let uploadResult: UploadResult;
    try {
      const contentType = file.mimetype || 'application/octet-stream';
      uploadResult = await this.uploadsService.uploadFile(
        file.buffer,
        file.originalname,
        folderPath,
        contentType,
      );
      this.logger.debug(
        `[BaseImageManager] File uploaded via UploadsService. URL: ${uploadResult.url}, PublicId: ${uploadResult.publicId}`,
      );
    } catch (error) {
      this.logger.error(
        `[BaseImageManager] Failed to upload file via UploadsService. Error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Could not upload image file: ${error.message}`,
      );
    }

    const imageMetadataToCreate = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      resourceType: uploadResult.resourceType,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes ? Number(uploadResult.bytes) : undefined,
      folder: uploadResult.folder,
      isCustomizedImage: isCustomizedImage,
      type: imageType
    };

    let newImage: ImageResponseDto;
    try {
      newImage = await this.imageService.create(imageMetadataToCreate);
      this.logger.log(
        `[BaseImageManager] Image metadata created with ID: ${newImage.id}.`,
      );
    } catch (error) {
      this.logger.error(
        `[BaseImageManager] Failed to create image metadata. Error: ${error.message}`,
        error.stack,
      );
      await this.uploadsService
        .deleteFile(uploadResult.publicId)
        .catch((e) =>
          this.logger.error(
            `Failed to rollback file ${uploadResult.publicId}: ${e.message}`,
          ),
        );
      throw new BadRequestException(
        `Could not persist image metadata: ${error.message}`,
      );
    }

    this.logger.log(
      `[BaseImageManager] Upload and persist complete for image ID: ${newImage.id}.`,
    );
    return newImage;
  }

  protected async removeImageAndMetadata(
    imageId: string,
    publicId: string,
    entityId: string,
  ): Promise<void> {
    this.logger.log(
      `[BaseImageManager] Attempting to remove image ID: ${imageId} (publicId: ${publicId}) from entity ${entityId}.`,
    );

    if (publicId) {
      try {
        await this.uploadsService.deleteFile(publicId);
        this.logger.log(
          `[BaseImageManager] Physical file with publicId ${publicId} deleted via UploadsService.`,
        );
      } catch (error) {
        this.logger.error(
          `[BaseImageManager] Failed to delete physical file with publicId ${publicId} via UploadsService. Error: ${error.message}`,
          error.stack,
        );
      }
    }

    try {
      await this.imageService.remove(imageId);
      this.logger.log(
        `[BaseImageManager] Image metadata ${imageId} removed from database.`,
      );
    } catch (error) {
      this.logger.error(
        `[BaseImageManager] Failed to remove image metadata ${imageId}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    this.logger.log(
      `[BaseImageManager] Image ID: ${imageId} successfully removed for entity ${entityId}.`,
    );
  }

  protected abstract linkImageToEntity(
    entityId: string,
    image: ImageResponseDto,
    optionalData?: any,
  ): Promise<void>;

  protected abstract unlinkImageFromEntity(
    entityId: string,
    imageId: string,
  ): Promise<void>;

  public abstract updateEntityImage(
    entityId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto>;
}
