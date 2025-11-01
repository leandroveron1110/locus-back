import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { BaseImageManager } from 'src/common/abstracts/base-image-manager.abstract';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { MenuProductValidation } from '../validations/menu-product-validator.service';
import { LinkMenuProductImageDto } from '../dtos/request/menu-product-image-request.dto';
import { ImageType } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class MenuProductImageService extends BaseImageManager {
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly prisma: PrismaService,
    protected readonly menuProductValidator: MenuProductValidation,
    protected readonly uploadsService: UploadsService,
    protected readonly logger: LoggingService,
  ) {
    super(imageService, uploadsService, prisma, logger);

    this.logger.setContext('MenuProductModule');
    this.logger.setService(this.constructor.name);
  }

  /**
   * 📤 Subir y asignar una imagen a un producto del menú
   */
  async uploadAndAssignImage(
    menuProductId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    this.logger.debug('Starting upload for menu product image', {
      menuProductId,
      fileName: file.originalname
    });

    await this.menuProductValidator.checkOne(menuProductId);

    try {
      const newImage = await this.uploadAndPersistImage(
        file,
        ImageType.MENU_PRODUCT,
        `menu-products/${menuProductId}`,
        false,
        "",
        "",
        "",
        []
      );

      await this.linkImageToEntity(menuProductId, newImage);

      this.logger.log('Menu product image uploaded and linked successfully', {
        menuProductId,
        imageId: newImage.id,
        imageUrl: newImage.url,
      });

      return newImage;
    } catch (error) {
      this.logger.error('Failed to upload or assign menu product image', {
        menuProductId,
        error: error.message,
        stack: error.stack,
      });

      // Rollback si algo falla
      try {
        await this.removeImageAndMetadata(
          file.filename,
          file.originalname,
          menuProductId,
        );
      } catch (rollbackError) {
        this.logger.error('Rollback failed for menu product image', {
          menuProductId,
          rollbackError: rollbackError.message,
        });
      }

      throw error;
    }
  }

  /**
   * 🔗 Vincula una imagen existente al producto del menú
   */
  async linkImageToEntity(
    menuProductId: string,
    image: { id: string; url: string },
  ): Promise<void> {
    this.logger.debug('Linking image to menu product', {
      menuProductId,
      imageId: image.id,
    });

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product) {
      this.logger.warn('Menu product not found when linking image', {
        menuProductId,
      });
      throw new NotFoundException(
        `MenuProduct with ID "${menuProductId}" not found.`,
      );
    }

    const oldImageId = product.imageId;

    try {
      await this.prisma.menuProduct.update({
        where: { id: menuProductId },
        data: { imageId: image.id, imageUrl: image.url },
      });

      this.logger.log('Image linked to menu product successfully', {
        menuProductId,
        newImageId: image.id,
        oldImageId,
      });

      if (oldImageId && oldImageId !== image.id) {
        await this.cleanupOldImage(oldImageId);
      }
    } catch (error) {
      this.logger.error('Failed to link image to menu product', {
        menuProductId,
        imageId: image.id,
        error: error.message,
      });
      throw new BadRequestException(
        `Could not assign image to menu product: ${error.message}`,
      );
    }
  }

  /**
   * 🧹 Limpieza de imágenes antiguas (solo si son personalizadas)
   */
  private async cleanupOldImage(oldImageId: string): Promise<void> {
    this.logger.debug('Cleaning up old image', { oldImageId });

    try {
      const oldImage = await this.imageService.findOne(oldImageId);
      if (!oldImage) return;

      if (oldImage.isCustomizedImage) {
        this.logger.debug('Old image is customized, skipping delete', {
          oldImageId,
        });
        return;
      }

      await this.imageService.remove(oldImageId);
      await this.uploadsService.deleteFile(oldImage.publicId).catch(() => {});
      this.logger.log('Old image cleaned up successfully', { oldImageId });
    } catch (error) {
      this.logger.error('Error cleaning up old image', {
        oldImageId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * ❌ Desvincula una imagen del producto
   */
  protected async unlinkImageFromEntity(
    menuProductId: string,
    imageId: string,
  ): Promise<void> {
    this.logger.debug('Unlinking image from menu product', {
      menuProductId,
      imageId,
    });

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product || product.imageId !== imageId) {
      throw new NotFoundException(
        `Image "${imageId}" is not associated with MenuProduct "${menuProductId}".`,
      );
    }

    await this.cleanupOldImage(imageId);

    await this.prisma.menuProduct.update({
      where: { id: menuProductId },
      data: { imageId: null, imageUrl: null },
    });

    this.logger.log('Image unlinked successfully', { menuProductId, imageId });
  }

  /**
   * 🗑️ Elimina la imagen de un producto
   */
  async removeProductImage(menuProductId: string): Promise<void> {
    this.logger.debug('Removing product image', { menuProductId });

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product || !product.imageId) {
      this.logger.warn('Product has no image to remove', { menuProductId });
      throw new NotFoundException(
        `MenuProduct "${menuProductId}" doesn't have an image to remove.`,
      );
    }

    await this.unlinkImageFromEntity(menuProductId, product.imageId);
  }

  /**
   * 🔁 Actualiza la imagen de un producto
   */
  async updateEntityImage(
    menuProductId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto> {
    this.logger.debug('Updating entity image', {
      menuProductId,
      imageId,
    });

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product || product.imageId !== imageId) {
      throw new NotFoundException(
        `Image with ID "${imageId}" is not the assigned image for menu product "${menuProductId}".`,
      );
    }

    if (file) {
      return this.uploadAndAssignImage(menuProductId, file);
    } else {
      return this.imageService.update(imageId, {
        ...updateDto,
        type: ImageType.MENU_PRODUCT,
      });
    }
  }

  /**
   * 🔗 Vincula una imagen ya existente (por catálogo)
   */
  async linkImageToMenuProduct(dto: LinkMenuProductImageDto): Promise<void> {
    const { menuProductId, imageId } = dto;
    this.logger.debug('Linking existing catalog image to product', {
      menuProductId,
      imageId,
    });

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    if (product.imageId && product.imageId !== image.id) {
      await this.cleanupOldImage(product.imageId);
    }

    await this.prisma.menuProduct.update({
      where: { id: menuProductId },
      data: { imageId: image.id, imageUrl: image.url },
    });

    this.logger.log('Existing image linked to menu product successfully', {
      menuProductId,
      imageId,
    });
  }
}
