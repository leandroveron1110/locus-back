// src/modules/business/services/business-logo.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { ImageType } from 'src/common/enums/image-type.enum';
import { BaseImageManager } from '../../../common/abstracts/base-image-manager.abstract';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IImageService } from 'src/image/interfaces/image-service.interface';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { IBusinessLogoService } from 'src/business/interfaces/business-logo-service.interface';

@Injectable()
export class BusinessLogoService
  extends BaseImageManager
  implements IBusinessLogoService
{
  constructor(
    protected readonly prisma: PrismaService,
    @Inject(TOKENS.IBusinessService)
    private readonly businessService: IBusinessService,
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    uploadsService: UploadsService,
  ) {
    super(imageService, uploadsService, prisma);
  }

  async uploadAndAssignLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `Starting upload and assign logo for business ID: ${businessId}.`,
    );
    await this.businessService.findOne(businessId);

    // Usa el método de la clase base para subir y persistir la imagen en el ImageService
    const newLogoImage = await this.uploadAndPersistImage(
      file,
      ImageType.LOGO,
      `businesses/${businessId}/logos`,
    );

    try {
      // Vincula el ID de la nueva imagen directamente al campo logoId del negocio
      await this.linkImageToEntity(businessId, newLogoImage);
      this.logger.log(
        `Successfully assigned new logo ${newLogoImage.id} to business ${businessId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to link new logo ${newLogoImage.id} to business ${businessId}. Error: ${error.message}`,
        error.stack,
      );
      // Si falla el enlace, intenta revertir la subida y el registro de metadatos
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

  // Método protegido para vincular la imagen a la entidad (el negocio)
  protected async linkImageToEntity(
    businessId: string,
    image: ImageResponseDto,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true }, // Solo necesitamos el ID del logo actual
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID "${businessId}" not found for logo assignment.`,
      );
    }

    const oldLogoId = business.logoId; // Guarda el ID del logo anterior si existe

    try {
      // Actualiza directamente el campo logoId en la tabla Business
      await this.prisma.business.update({
        where: { id: businessId },
        data: { logoId: image.id },
      });
      this.logger.log(`Business ${businessId} logoId updated to ${image.id}.`);

      // Si había un logo anterior, iniciamos su limpieza
      if (oldLogoId) {
        this.cleanupOldLogo(oldLogoId);
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

  // Método privado para limpiar un logo antiguo (eliminar metadatos y archivo físico)
  private async cleanupOldLogo(oldLogoId: string): Promise<void> {
    this.logger.log(
      `Preparing to clean up the old logo with ID: ${oldLogoId}.`,
    );
    try {
      // Obtener los metadatos del logo antiguo para obtener su publicId
      const oldLogo = await this.imageService.findOne(oldLogoId);
      // Eliminar los metadatos del ImageService
      await this.imageService.remove(oldLogoId);
      // Eliminar el archivo físico del proveedor de almacenamiento
      await this.uploadsService
        .deleteFile(oldLogo.publicId)
        .catch((e) =>
          this.logger.error(
            `Failed to delete old logo file ${oldLogo.publicId}: ${e.message}`,
          ),
        );
      this.logger.log(
        `Old logo with ID ${oldLogoId} has been deleted (metadata and file).`,
      );
    } catch (error) {
      this.logger.error(
        `Error cleaning up old logo ${oldLogoId}: ${error.message}`,
        error.stack,
      );
      // Aquí puedes decidir si quieres lanzar el error o simplemente registrarlo.
      // Para la limpieza, a menudo es aceptable solo registrar el error para no bloquear la operación principal.
    }
  }

  // Método protegido para desvincular una imagen de la entidad (el negocio)
  protected async unlinkImageFromEntity(
    businessId: string,
    imageId: string,
  ): Promise<void> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    // Verifica que el logo que se quiere desvincular realmente sea el logo actual del negocio
    if (!business || business.logoId !== imageId) {
      throw new NotFoundException(
        `Logo with ID "${imageId}" is not associated with business "${businessId}".`,
      );
    }

    try {
      // Establece el logoId del negocio a null
      await this.prisma.business.update({
        where: { id: businessId },
        data: { logoId: null },
      });
      this.logger.log(`Logo association removed from business ${businessId}.`);
      // Llama a la limpieza del logo recién desvinculado
      await this.cleanupOldLogo(imageId);
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

  // Obtiene el logo de un negocio específico
  async getBusinessLogo(businessId: string): Promise<ImageResponseDto | null> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { logoId: true },
    });

    if (!business || !business.logoId) {
      return null; // El negocio no tiene logo asignado
    }

    // Pide los metadatos del logo al ImageService usando el logoId
    return this.imageService.findOne(business.logoId);
  }

  // Implementación de la interfaz: Obtener todas las imágenes para la entidad (en este caso, solo el logo)
  public async getImagesForEntity(
    businessId: string,
  ): Promise<ImageResponseDto[]> {
    // Primero, obtener el logoId desde la base de datos del negocio
    const logoId = (
      await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { logoId: true },
      })
    )?.logoId;
    if (logoId) {
      // Si hay un logoId, pide los metadatos al ImageService
      const logo = await this.imageService.findOne(logoId);
      return logo ? [logo] : [];
    }
    return []; // No hay logo
  }

  // Elimina el logo de un negocio
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

    // Usa el método para desvincular la imagen de la entidad, que a su vez maneja la limpieza
    await this.unlinkImageFromEntity(businessId, business.logoId);
    this.logger.log(`Logo removal initiated for business "${businessId}".`);
  }

  // Actualiza una imagen de entidad (en este caso, el logo)
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

    // Verifica que la imagen que se quiere actualizar sea realmente el logo del negocio
    if (!business || business.logoId !== imageId) {
      throw new NotFoundException(
        `Image with ID "${imageId}" is not the logo for business "${businessId}".`,
      );
    }

    if (file) {
      // Si se proporciona un nuevo archivo, reemplaza el logo actual
      return this.uploadAndAssignLogo(businessId, file);
    } else {
      // Si no hay archivo, solo actualiza los metadatos del logo existente en ImageService
      return this.imageService.update(imageId, {
        ...updateDto,
        type: ImageType.LOGO,
      });
    }
  }
}
