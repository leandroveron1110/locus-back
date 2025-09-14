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



/**
 * Subir nuevos archivos y vincular la url
 * eliminar el archivo y la vinculacion
 * 
 * vicular con un archivo general
 * desbincular sin eliminar el archivo general
 */

@Injectable()
export class MenuProductImageService extends BaseImageManager {
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly prisma: PrismaService,
    private readonly menuProductValidator: MenuProductValidation,
    uploadsService: UploadsService,
  ) {
    super(imageService, uploadsService, prisma);
  }

  /**
   * Metodos que trabajan con nueva imagen
   */

  async uploadAndAssignImage(
    menuProductId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {

    // validamos que exista el producto
    await this.menuProductValidator.checkOne(menuProductId);

    // subimos la imagen a cloud
    const newImage = await this.uploadAndPersistImage(
      file,
      ImageType.MENU_PRODUCT,
      `menu-products/${menuProductId}`,
      true,
    );

    try {

      // vinculamos la url al product
      await this.linkImageToEntity(menuProductId, newImage);
    } catch (error) {
      await this.removeImageAndMetadata(
        newImage.id,
        newImage.publicId,
        menuProductId,
      ).catch((e) =>
        this.logger.error(
          `Failed rollback for image ${newImage.id}: ${e.message}`,
        ),
      );
      throw error;
    }

    return newImage;
  }

  protected async linkImageToEntity(
    menuProductId: string,
    image: ImageResponseDto,
  ): Promise<void> {
    // buscamos el product con la imageId
    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product) {
      throw new NotFoundException(
        `MenuProduct with ID "${menuProductId}" not found.`,
      );
    }

    // obtenemos al imageId  anterior
    const oldImageId = product.imageId;

    try {
      // actualizamos menu-product con en nuevo imageId y imageUrl
      await this.prisma.menuProduct.update({
        where: { id: menuProductId },
        data: { imageId: image.id, imageUrl: image.url },
      });

      // si olImageI existe y es igual al image.id, eliminamos el archivo
      if (oldImageId && oldImageId !== image.id) {
        await this.cleanupOldImage(oldImageId);
      }
    } catch (error) {
      throw new BadRequestException(
        `Could not assign image to menu product: ${error.message}`,
      );
    }
  }

  /**
   * Metodo para eliminar una imagen
   * solo si la imagen es personalizada
   */
  private async cleanupOldImage(oldImageId: string): Promise<void> {
    try {
      const oldImage = await this.imageService.findOne(oldImageId);
      if (!oldImage) return;

      // 🛑 Solo eliminamos si es personalizada
      if (!oldImage.isCustomizedImage) return;

      // eliminalos la imagen de la talba image
      await this.imageService.remove(oldImageId);
      // metodo para eliminar el archivo img
      await this.uploadsService.deleteFile(oldImage.publicId).catch(() => {});
    } catch (error) {
      this.logger.error(
        `Error cleaning up old image ${oldImageId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Metodo para debincular/eliminar una imagen
   */
  protected async unlinkImageFromEntity(
    menuProductId: string,
    imageId: string,
  ): Promise<void> {
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
  }

  async removeProductImage(menuProductId: string): Promise<void> {
    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product || !product.imageId) {
      throw new NotFoundException(
        `MenuProduct "${menuProductId}" doesn't have an image to remove.`,
      );
    }

    await this.unlinkImageFromEntity(menuProductId, product.imageId);
  }


  async updateEntityImage(
    menuProductId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto> {
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

  // ✅ Método para vincular una imagen ya existente (de catálogo)
  async linkImageToMenuProduct(dto: LinkMenuProductImageDto): Promise<void> {
    const { menuProductId, imageId } = dto;

    const product = await this.prisma.menuProduct.findUnique({
      where: { id: menuProductId },
      select: { imageId: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    if (product.imageId && product.imageId !== image.id) {
      await this.cleanupOldImage(product.imageId);
    }

    await this.prisma.menuProduct.update({
      where: { id: menuProductId },
      data: {
        imageId: image.id,
        imageUrl: image.url,
      },
    });
  }
}
