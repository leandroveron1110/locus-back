// src/modules/image/services/image.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Asegúrate de que esta ruta sea correcta
import { CreateImageDto } from '../dtos/Request/create-image.dto';
import { UpdateImageDto } from '../dtos/Request/update-image.dto';
import { ImageResponseDto } from '../dtos/Response/image-response.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { IImageService } from '../interfaces/image-service.interface';
import { UploadsService } from 'src/uploads/services/uploads.service';
import { UploadResult } from 'src/uploads/interfaces/storage-provider.interface';
import { Image, ImageType, Prisma } from '@prisma/client';

@Injectable()
export class ImageService implements IImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private prisma: PrismaService,
    protected readonly uploadsService: UploadsService,
  ) {}

  protected async uploadAndPersistImage(
    file: Express.Multer.File,
    imageType: ImageType,
    folderPath: string,
    isCustomizedImage: boolean,
    name: string,
    altText: string,
    description: string,
    tags: string[]
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

    const imageMetadataToCreate: CreateImageDto = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      format: uploadResult.format,
      resourceType: uploadResult.resourceType,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes ? Number(uploadResult.bytes) : undefined,
      folder: uploadResult.folder,
      isCustomizedImage: isCustomizedImage,
      type: imageType,
      altText,
      description,
      name,
      tags
    };

    let newImage: ImageResponseDto;
    try {
      newImage = await this.create(imageMetadataToCreate);
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

  // sube imagen de uso general
  // async uploadAndAssignImage(
  //   file: Express.Multer.File,
  //   type: ImageType,
  // ): Promise<ImageResponseDto> {
  //   // subimos la imagen a cloud
  //   const newImage = await this.uploadAndPersistImage(
  //     file,
  //     type,
  //     `default/`,
  //     false,
  //   );

  //   return newImage;
  // }

  /**
   * Crea una nueva entrada de metadatos de imagen en la base de datos.
   * Esto NO asocia la imagen a ninguna entidad (negocio, producto, etc.).
   * Esa asignación se hace en los servicios específicos (ej., BusinessImageService).
   * @param createImageDto Datos de la imagen a crear.
   * @returns La imagen creada (metadatos).
   */
  async create(createImageDto: CreateImageDto): Promise<ImageResponseDto> {
    try {
      this.logger.log(
        `Intentando de crear una imagen: ${JSON.stringify(createImageDto)}`,
      );
      const image = await this.prisma.image.create({
        data: { ...createImageDto },
      });
      this.logger.log(`Imagen creada ID: ${image.id}`);
      return ImageResponseDto.fromPrisma(image);
    } catch (error) {
      this.logger.error(
        `Failed to create image. Error: ${error.message}`,
        error.stack,
      );
      throw new error();
    }
  }

  /**
   * Obtiene todas las imágenes (metadatos).
   * @returns Lista de todas las imágenes.
   */
  async findAll(): Promise<ImageResponseDto[]> {
    this.logger.log(`Attempting to retrieve all image`);
    const images = await this.prisma.image.findMany();
    this.logger.log(`Found ${images.length} images.`);
    return images.map(ImageResponseDto.fromPrisma);
  }

  /**
   * Obtiene una imagen por su ID.
   * @param id ID de la imagen.
   * @returns La imagen encontrada.
   * @throws NotFoundException Si la imagen no se encuentra.
   */
  async findOne(id: string): Promise<ImageResponseDto> {
    this.logger.log(`Attempting to find image with ID: ${id}`);
    const image = await this.prisma.image.findUnique({
      where: { id },
    });
    if (!image) {
      this.logger.warn(`Image with ID "${id}" not found.`);
      throw new NotFoundException(`Image with ID "${id}" not found.`);
    }
    this.logger.log(`Successfully found image with ID: ${id}`);
    return ImageResponseDto.fromPrisma(image);
  }

  async findManyByIds(ids: string[]): Promise<ImageResponseDto[]> {
    if (ids.length === 0) {
      return [];
    }
    const images = await this.prisma.image.findMany({
      where: {
        id: { in: ids },
      },
    });

    const formImages: ImageResponseDto[] = images.map((img) =>
      ImageResponseDto.fromPrisma(img),
    );

    return formImages;
  }

  /**
   * Actualiza los metadatos de una imagen existente.
   * @param id ID de la imagen a actualizar.
   * @param updateImageDto Datos para actualizar.
   * @returns La imagen actualizada.
   * @throws NotFoundException Si la imagen no se encuentra.
   */
  async update(
    id: string,
    updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    this.logger.log(
      `Attempting to update image with ID: ${id} with data: ${JSON.stringify(updateImageDto)}`,
    );
    try {
      const updatedImage = await this.prisma.image.update({
        where: { id },
        data: updateImageDto,
      });
      this.logger.log(`Successfully updated image with ID: ${id}`);

      return ImageResponseDto.fromPrisma(updatedImage);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // P2025: An operation failed because it depends on one or more records that were required but not found.
        this.logger.warn(`Image with ID "${id}" not found for update.`);
        throw new NotFoundException(`Image with ID "${id}" not found.`);
      }
      this.logger.error(
        `Failed to update image with ID: ${id}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Elimina una imagen de la base de datos.
   * NOTA IMPORTANTE: Esto SOLO elimina el registro de la tabla 'imagenes'.
   * La eliminación física de la imagen del proveedor de almacenamiento (ej. Cloudinary)
   * debe manejarse por separado, por ejemplo, en un hook de eliminación
   * o un servicio dedicado a la gestión de almacenamiento externo.
   * @param id ID de la imagen a eliminar.
   * @throws NotFoundException Si la imagen no se encuentra.
   * @throws ConflictException Si la imagen está siendo referenciada por otra tabla (dependiendo de onDelete).
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove image with ID: ${id}`);

    // Primero, verificar si la imagen existe para lanzar NotFoundException si no
    await this.findOne(id);
    try {
      // Prisma manejará las cascadas si configuraste onDelete en el schema.
      // Las entradas de la tabla intermedia (BusinessImage, ProductImage) que
      // referencien esta imagen se eliminarán.
      // Las relaciones 1:1 (logoId, avatarId, etc.) se pondrán a null.
      await this.prisma.image.delete({
        where: { id },
      });
      this.logger.log(`Successfully removed image with ID: ${id}`);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        // P2003: Foreign key constraint failed on the field
        this.logger.warn(
          `Failed to remove image with ID "${id}" due to foreign key constraint.`,
          error.stack,
        );
        throw new ConflictException(
          `Image with ID "${id}" cannot be removed as it is referenced by other entities.`,
        );
      }
      this.logger.error(
        `Failed to remove image with ID: ${id}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
