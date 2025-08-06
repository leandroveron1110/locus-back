// src/modules/business/services/business-gallery.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { BaseImageManager } from '../../../common/abstracts/base-image-manager.abstract';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { IBusinessGalleryService } from 'src/business/interfaces/business-gallery.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { ImageDto } from 'src/business/interfaces/image.interface';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { ImageType } from '@prisma/client';

@Injectable()
export class BusinessGalleryService
  extends BaseImageManager
  implements IBusinessGalleryService
{
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    uploadsService: UploadsService,
  ) {
    super(imageService, uploadsService, prisma);
  }

  // Subimos la imagen y la guardamos en galeria
  async uploadAndAddGalleryImage(
    businessId: string,
    file: Express.Multer.File,
    order?: number,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `[BusinessGalleryService] Starting upload and add gallery image for business ID: ${businessId}.`,
    );
    await this.businessValidator.checkOne(businessId);

    const newGalleryImage = await this.uploadAndPersistImage(
      file,
      ImageType.GALLERY,
      `businesses/${businessId}/gallery`,
      true,
    );

    try {
      await this.linkImageToEntity(businessId, newGalleryImage, { order });
      this.logger.log(
        `[BusinessGalleryService] Successfully added gallery image ${newGalleryImage.id} to business ${businessId}.`,
      );
    } catch (error) {
      this.logger.error(
        `[BusinessGalleryService] Failed to link new gallery image ${newGalleryImage.id} to business ${businessId}. Error: ${error.message}`,
        error.stack,
      );
      await this.removeImageAndMetadata(
        newGalleryImage.id,
        newGalleryImage.publicId,
        businessId,
      ).catch((e) =>
        this.logger.error(
          `Failed to rollback new gallery image ${newGalleryImage.id}: ${e.message}`,
        ),
      );
      throw error;
    }
    return newGalleryImage;
  }

  // enlazamos la imagen a la entidad
  protected async linkImageToEntity(
    businessId: string,
    image: ImageResponseDto,
    optionalData?: { order?: number },
  ): Promise<void> {
    try {
      await this.prisma.businessImage.create({
        data: {
          businessId: businessId,
          imageId: image.id,
          imageUrl: image.url,
          order: optionalData?.order,
        },
      });
      this.logger.log(
        `[BusinessGalleryService] Image ${image.id} successfully associated with business ${businessId} in gallery.`,
      );
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Image ${image.id} is already in the gallery for business ${businessId}.`,
        );
      }
      this.logger.error(
        `[BusinessGalleryService] Failed to create association for gallery image ${image.id}. Error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Could not add image to business gallery: ${error.message}`,
      );
    }
  }

  protected async unlinkImageFromEntity(
    businessId: string,
    imageId: string,
  ): Promise<void> {
    this.logger.log(
      `[BusinessGalleryService] Attempting to unlink gallery image ${imageId} from business ${businessId}.`,
    );

    const association = await this.prisma.businessImage.findUnique({
      where: { businessId_imageId: { businessId, imageId } },
    });

    if (!association) {
      throw new NotFoundException(
        `Image with ID "${imageId}" is not found in gallery for Business with ID "${businessId}".`,
      );
    }

    try {
      await this.prisma.businessImage.delete({
        where: { businessId_imageId: { businessId, imageId } },
      });
      this.logger.log(
        `[BusinessGalleryService] Association for image ${imageId} removed from gallery of business ${businessId}.`,
      );
    } catch (error) {
      this.logger.error(
        `[BusinessGalleryService] Failed to remove association for gallery image ${imageId} from business ${businessId}. Error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Could not remove image association: ${error.message}`,
      );
    }
  }

  public async getSimpleGalleryForEntity(
    businessId: string,
  ): Promise<{ id: string; url: string; order: number }[]> {
    const businessImages = await this.prisma.businessImage.findMany({
      where: { businessId: businessId },
      select: { imageId: true, order: true, imageUrl: true }, // También seleccionamos el orden si lo necesitamos
      orderBy: { order: 'asc' }, // Si las imágenes de galería tienen un orden
    });

    if (businessImages.length === 0) {
      return [];
    }

    const imagsUrls: {
      id: string;
      url: string;
      order: number;
    }[] = [];
    businessImages.forEach((b) => {
      if (b.imageUrl && b.order) {
        imagsUrls.push({
          id: b.imageId,
          order: b.order,
          url: b.imageUrl,
        });
      }
    });

    return imagsUrls;
  }

  public async getImagesForEntity(
    businessId: string,
  ): Promise<ImageResponseDto[]> {
    // this.logger.log(
    //   `[BusinessGalleryService] Getting gallery image IDs for business ID: ${businessId}.`,
    // );

    // // 1. Obtener los IDs de las imágenes de la galería desde la tabla de relación local
    // const businessImages = await this.prisma.businessImage.findMany({
    //   where: { businessId: businessId },
    //   select: { imageId: true, order: true, imageUrl: true }, // También seleccionamos el orden si lo necesitamos
    //   orderBy: { order: 'asc' }, // Si las imágenes de galería tienen un orden
    // });

    // if (businessImages.length === 0) {
    //   return [];
    // }

    // const imageIds = businessImages.map((bi) => bi.imageId);

    // this.logger.log(
    //   `[BusinessGalleryService] Found ${imageIds.length} image IDs. Requesting metadata from ImageService.`,
    // );

    // // 2. Pedir al ImageService los metadatos completos de estas imágenes
    // const imagesMetadata = await this.imageService.findManyByIds(imageIds);

    // // Opcional: Reordenar las imágenes según el 'order' guardado en BusinessImage
    // const orderedImages: ImageResponseDto[] = [];
    // businessImages.forEach((bi) => {
    //   const img = imagesMetadata.find((im) => im.id === bi.imageId);
    //   if (img) {
    //     orderedImages.push(img);
    //   }
    // });

    return [];
  }

  public async updateEntityImage(
    businessId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: ImageDto,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `[BusinessGalleryService] Update operation for gallery image ID: ${imageId} of business ${businessId}.`,
    );
    await this.businessValidator.checkOne(businessId);

    const association = await this.prisma.businessImage.findUnique({
      where: { businessId_imageId: { businessId, imageId } },
      include: { image: true },
    });

    if (!association) {
      throw new NotFoundException(
        `Image with ID "${imageId}" is not found in gallery for Business with ID "${businessId}".`,
      );
    }

    let updatedImage: ImageResponseDto;
    let oldPublicId: string | undefined;

    if (file) {
      this.logger.debug(
        `[BusinessGalleryService] Replacing gallery image with new file for business ${businessId}.`,
      );
      oldPublicId = association.image.publicId;

      const newUploadResult = await this.uploadsService.uploadFile(
        file.buffer,
        file.originalname,
        `businesses/${businessId}/gallery`,
        file.mimetype || 'application/octet-stream',
      );

      updatedImage = await this.imageService.update(imageId, {
        url: newUploadResult.url,
        publicId: newUploadResult.publicId,
        format: newUploadResult.format,
        width: newUploadResult.width,
        height: newUploadResult.height,
        bytes: newUploadResult.bytes
          ? Number(newUploadResult.bytes)
          : undefined,
        folder: newUploadResult.folder,
        resourceType: newUploadResult.resourceType,
      });

      if (oldPublicId) {
        await this.uploadsService
          .deleteFile(oldPublicId)
          .catch((e) =>
            this.logger.error(
              `Failed to delete old gallery file ${oldPublicId}: ${e.message}`,
            ),
          );
        this.logger.log(
          `[BusinessGalleryService] Old physical file ${oldPublicId} deleted from Cloudinary.`,
        );
      }
    } else {
      updatedImage = ImageResponseDto.fromPrisma(association.image);
    }

    if (updateDto.order !== undefined) {
      try {
        await this.prisma.businessImage.update({
          where: { businessId_imageId: { businessId, imageId } },
          data: { order: updateDto.order },
        });
        this.logger.log(
          `[BusinessGalleryService] Gallery image association order updated for ID: ${imageId} to ${updateDto.order}.`,
        );
      } catch (error) {
        this.logger.error(
          `[BusinessGalleryService] Failed to update order for gallery image ${imageId}. Error: ${error.message}`,
          error.stack,
        );
        throw new BadRequestException(
          `Could not update order for gallery image: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `[BusinessGalleryService] Successfully updated gallery image ID: ${imageId} for business ID: ${businessId}.`,
    );
    return updatedImage;
  }

  async removeGalleryImageFromBusiness(
    businessId: string,
    imageId: string,
  ): Promise<void> {
    this.logger.log(
      `[BusinessGalleryService] Attempting to remove gallery image ID: ${imageId} from business ID: ${businessId}.`,
    );
    await this.businessValidator.checkOne(businessId);

    const image = await this.imageService.findOne(imageId);
    if (!image) {
      this.logger.warn(
        `[BusinessGalleryService] Image metadata with ID "${imageId}" not found.`,
      );
      throw new NotFoundException(`Image with ID "${imageId}" not found.`);
    }

    await this.unlinkImageFromEntity(businessId, imageId);

    const totalReferences = await this.prisma.image.count({
      where: {
        id: imageId,
        OR: [
          { businessLogo: { isNot: null } },
          { businessGalleries: { some: {} } },
          { userAvatar: { isNot: null } },
          // { menuItemImage: { isNot: null } },
          // { productImage: { isNot: null } },
          // { productGalleries: { some: {} } },
          // { eventImage: { isNot: null } },
        ],
      },
    });

    if (totalReferences === 0) {
      this.logger.log(
        `[BusinessGalleryService] Image ${imageId} is no longer referenced. Deleting metadata and physical file.`,
      );
      await this.removeImageAndMetadata(imageId, image.publicId, businessId);
    } else {
      this.logger.log(
        `[BusinessGalleryService] Image ${imageId} still referenced (${totalReferences} references remaining). Only association removed.`,
      );
    }
    this.logger.log(
      `[BusinessGalleryService] Successfully removed gallery image ID: ${imageId} from business ID: ${businessId}.`,
    );
  }

  /**
   * Asocia una imagen existente a la galería del negocio.
   * No sube imagen, solo crea una nueva entrada en `BusinessImage`.
   */
  async addExistingImageToGallery(
    businessId: string,
    imageId: string,
    order?: number,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `[BusinessGalleryService] Adding existing image ${imageId} to gallery of business ${businessId}.`,
    );

    await this.businessValidator.checkOne(businessId);

    const image = await this.imageService.findOne(imageId);
    if (!image) {
      throw new NotFoundException(`Image with ID "${imageId}" not found.`);
    }

    if (!image.isCustomizedImage) {
      throw new BadRequestException(
        `No se puede asignar esta imagen con el id ${image.id}`,
      );
    }

    try {
      await this.linkImageToEntity(businessId, image, { order });
    } catch (error) {
      this.logger.error(
        `[BusinessGalleryService] Error linking existing image ${imageId} to business ${businessId}: ${error.message}`,
      );
      throw error;
    }

    return image;
  }
}
