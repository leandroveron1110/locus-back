// src/modules/business/services/business-logo.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { BaseImageManager } from '../../../common/abstracts/base-image-manager.abstract';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { ImageType } from '@prisma/client';
import { ISearchableBusinessCrudService } from 'src/search/interfaces/searchable-business-crud-service.interface';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class BusinessLogoService extends BaseImageManager {
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private readonly businessValidator: IExistenceValidator,
    uploadsService: UploadsService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private searchableBusinessCrudService: ISearchableBusinessCrudService,
    protected readonly logger: LoggingService, // ✅ inyectado
    

  ) {
    super(imageService, uploadsService, prisma, logger);
    this.logger.setContext('Business');
    this.logger.setService(this.constructor.name);
  }

  /**
   * Sube una imagen y la asigna como logo del negocio.
   * Elimina el logo anterior si era personalizado.
   */
  async uploadAndAssignLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `Starting upload and assign logo for business ID: ${businessId}.`,
    );

    const [_, existingBusiness] = await Promise.all([
      this.businessValidator.checkOne(businessId),
      this.prisma.business.findUnique({
        where: { id: businessId },
        select: { logoId: true },
      }),
    ]);

    let newLogoImage: ImageResponseDto;

    // Paso 2: Decidir si actualizar o crear
    if (existingBusiness && existingBusiness.logoId) {
      this.logger.log(
        `Existing logo found for business ${businessId}. Updating...`,
      );
      // Llama al método para actualizar el archivo
      newLogoImage = await this.updateLogoFile(existingBusiness.logoId, file);
    } else {
      this.logger.log(
        `No existing logo found for business ${businessId}. Creating and assigning a new one...`,
      );
      // Llama al método para crear y asignar un nuevo logo
      newLogoImage = await this.createAndAssignLogo(businessId, file);
    }

    // Paso 3: Unificar la actualización del servicio de búsqueda
    // Esta acción siempre se realiza, independientemente de si se creó o actualizó el logo
    try {
      await this.searchableBusinessCrudService.update({
        id: businessId,
        logoUrl: newLogoImage.url,
      });
      this.logger.log(
        `Searchable business record updated for business ${businessId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update searchable business record for ${businessId}: ${error.message}`,
      );
      // Nota: Aquí podrías considerar hacer un rollback de la imagen si la actualización falla,
      // pero el impacto es bajo y podría complicar demasiado la lógica.
    }

    return newLogoImage;
  }
  private async createAndAssignLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    const newLogoImage = await this.uploadAndPersistImage(
      file,
      ImageType.AVATAR,
      `businesses/${businessId}/logos`,
      false,
      "",
      "",
      "",
      []
    );

    try {
      await this.linkImageToEntity(businessId, newLogoImage);
      this.logger.log(
        `Successfully assigned new logo ${newLogoImage.id} to business ${businessId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to link new logo ${newLogoImage.id} to business ${businessId}. Error: ${error.message}`,
        error.stack,
      );
      // Rollback en caso de fallo
      await this.removeImageAndMetadata(
        newLogoImage.id,
        newLogoImage.publicId,
        businessId,
      ).catch((e) =>
        this.logger.error(
          `Failed to rollback new logo ${newLogoImage.id}: ${e.message}`,
        ),
      );
      throw error;
    }
    return newLogoImage;
  }

  // 👇 Nuevo método privado para actualizar el archivo de un logo existente
  private async updateLogoFile(
    imageId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    const existingImage = await this.imageService.findOne(imageId);
    if (!existingImage) {
      throw new NotFoundException(
        `Image metadata with ID "${imageId}" not found.`,
      );
    }

    const newUploadResult = await this.uploadsService.uploadFile(
      file.buffer,
      file.originalname,
      existingImage.folder || '',
      file.mimetype || 'application/octet-stream',
    );

    // Se elimina el archivo anterior de forma asíncrona para no bloquear el proceso
    if (existingImage.publicId) {
      this.uploadsService
        .deleteFile(existingImage.publicId)
        .catch((e) =>
          this.logger.error(`Failed to delete old file: ${e.message}`),
        );
    }

    // Se actualizan los metadatos en la base de datos
    const updatedImage = await this.imageService.update(imageId, {
      url: newUploadResult.url,
      publicId: newUploadResult.publicId,
      format: newUploadResult.format,
      width: newUploadResult.width,
      height: newUploadResult.height,
      bytes: Number(newUploadResult.bytes),
      folder: newUploadResult.folder,
      resourceType: newUploadResult.resourceType,
    });

    this.logger.log(`Successfully updated image metadata for ID: ${imageId}.`);

    return updatedImage;
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
    this.logger.log(
      `Preparing to clean up the old logo with ID: ${oldLogoId}.`,
    );

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
        this.logger.log(
          `Old logo with ID ${oldLogoId} deleted (metadata and file).`,
        );
      } else {
        this.logger.log(
          `Skipped deleting shared logo ${oldLogoId} (not customized).`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up old logo ${oldLogoId}: ${error.message}`,
        error.stack,
      );
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
      throw new BadRequestException(
        `Could not unassign the logo: ${error.message}`,
      );
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
      throw new NotFoundException(
        `Business "${businessId}" doesn't have a logo to remove.`,
      );
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
    this.logger.log(
      `Assigning existing image ${imageId} as logo for business ${businessId}.`,
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
      throw new BadRequestException(
        `Could not assign image as logo: ${error.message}`,
      );
    }
  }
}
