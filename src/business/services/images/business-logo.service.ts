// src/modules/business/services/business-logo.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { BaseImageManager } from '../../../common/abstracts/base-image-manager.abstract';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { ImageType } from '@prisma/client';

@Injectable()
export class BusinessLogoService extends BaseImageManager {
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


  /**
   * Sube una imagen y la asigna como logo del negocio.
   * Elimina el logo anterior si era personalizado.
   */
  async uploadAndAssignLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    this.logger.log(`Starting upload and assign logo for business ID: ${businessId}.`);

    await this.businessValidator.checkOne(businessId);

    const newLogoImage = await this.uploadAndPersistImage(
      file,
      ImageType.AVATAR,
      `businesses/${businessId}/logos`,
      true, // La imagen subida por el usuario se marca como personalizada
    );

    try {
      await this.linkImageToEntity(businessId, newLogoImage);
      this.logger.log(`Successfully assigned new logo ${newLogoImage.id} to business ${businessId}.`);
    } catch (error) {
      // Si falla el enlace, se hace rollback eliminando la imagen recién subida
      this.logger.error(
        `Failed to link new logo ${newLogoImage.id} to business ${businessId}. Error: ${error.message}`,
        error.stack,
      );
      await this.removeImageAndMetadata(
        newLogoImage.id,
        newLogoImage.publicId,
        businessId,
      ).catch((e) =>
        this.logger.error(`Failed to rollback new logo ${newLogoImage.id}: ${e.message}`),
      );
      throw error;
    }

    return newLogoImage;
  }

  /**
   * Asocia una imagen como logo del negocio.
   * Si ya tenía un logo anterior, lo elimina si era personalizado.
   */
  protected async linkImageToEntity(
    businessId: string,
    image: ImageResponseDto,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID "${businessId}" not found for logo assignment.`,
      );
    }

    const oldLogoId = business.logoId;

    try {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { logoId: image.id, logoUrl: image.url },
      });

      this.logger.log(`Business ${businessId} logoId updated to ${image.id}.`);

      if (oldLogoId && oldLogoId !== image.id) {
        await this.cleanupOldLogo(oldLogoId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update business ${businessId} with new logo ID ${image.id}. Error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Could not assign image as logo to business: ${error.message}`,
      );
    }
  }

  /**
   * Elimina un logo anterior si es personalizado (es decir, no es compartido).
   */
  private async cleanupOldLogo(oldLogoId: string): Promise<void> {
    this.logger.log(`Preparing to clean up the old logo with ID: ${oldLogoId}.`);

    try {
      const oldLogo = await this.imageService.findOne(oldLogoId);
      if (!oldLogo) {
        this.logger.warn(`Old logo ${oldLogoId} metadata not found.`);
        return;
      }

      // Solo elimina la imagen si fue personalizada
      if (oldLogo.isCustomizedImage) {
        await this.imageService.remove(oldLogoId);
        await this.uploadsService.deleteFile(oldLogo.publicId).catch(() => {});
        this.logger.log(`Old logo with ID ${oldLogoId} deleted (metadata and file).`);
      } else {
        this.logger.log(`Skipped deleting shared logo ${oldLogoId} (not customized).`);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up old logo ${oldLogoId}: ${error.message}`, error.stack);
    }
  }

  /**
   * Desvincula un logo actual del negocio y lo elimina si es personalizado.
   */
  protected async unlinkImageFromEntity(
    businessId: string,
    imageId: string,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    if (!business || business.logoId !== imageId) {
      throw new NotFoundException(
        `Logo with ID "${imageId}" is not associated with business "${businessId}".`,
      );
    }

    try {
      await this.cleanupOldLogo(imageId);
      await this.prisma.business.update({
        where: { id: businessId },
        data: { logoId: null, logoUrl: null },
      });
      this.logger.log(`Logo association removed from business ${businessId}.`);
    } catch (error) {
      this.logger.error(
        `Failed to remove logo association for business ${businessId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Could not unassign the logo: ${error.message}`);
    }
  }


  /**
   * Elimina el logo actual de un negocio (si lo tiene).
   */
  async removeBusinessLogo(businessId: string): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    if (!business || !business.logoId) {
      throw new NotFoundException(`Business "${businessId}" doesn't have a logo to remove.`);
    }

    await this.unlinkImageFromEntity(businessId, business.logoId);
    this.logger.log(`Logo removal initiated for business "${businessId}".`);
  }

  /**
   * Actualiza el logo de un negocio.
   * Si se envía un archivo, sube uno nuevo y reemplaza el anterior.
   * Si no, actualiza solo los metadatos de la imagen actual.
   */
  public async updateEntityImage(
    businessId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    if (!business || business.logoId !== imageId) {
      throw new NotFoundException(
        `Image with ID "${imageId}" is not the logo for business "${businessId}".`,
      );
    }

    if (file) {
      return this.uploadAndAssignLogo(businessId, file); // sube nuevo y reemplaza
    } else {
      return this.imageService.update(imageId, {
        ...updateDto,
        type: ImageType.AVATAR,
      });
    }
  }


  /**
 * Asigna una imagen existente como logo del negocio.
 * No sube ni elimina ninguna imagen, solo actualiza los campos logoUrl y logoId.
 * Útil para logos compartidos disponibles en una galería predefinida.
 */
async assignExistingImageAsLogo(
  businessId: string,
  imageId: string,
): Promise<ImageResponseDto> {
  this.logger.log(`Assigning existing image ${imageId} as logo for business ${businessId}.`);

  await this.businessValidator.checkOne(businessId);

  const image = await this.imageService.findOne(imageId);

  if (!image) {
    throw new NotFoundException(`Image with ID "${imageId}" not found.`);
  }

  if(!image.isCustomizedImage) {
    throw new BadRequestException(`No se puede asignar esta imagen con el id ${image.id}`)
  }

  try {
    const oldLogoId = (
      await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { logoId: true },
      })
    )?.logoId;

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        logoId: image.id,
        logoUrl: image.url,
      },
    });

    // Elimina el anterior si era personalizado
    if (oldLogoId && oldLogoId !== image.id) {
      await this.cleanupOldLogo(oldLogoId);
    }

    return image;
  } catch (error) {
    this.logger.error(
      `Failed to assign existing image ${imageId} as logo for business ${businessId}.`,
      error.stack,
    );
    throw new BadRequestException(`Could not assign image as logo: ${error.message}`);
  }
}

}

