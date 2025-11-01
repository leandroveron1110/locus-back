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
import { LoggingService } from 'src/logging/logging.service';
@Injectable()
export abstract class BaseImageManager {
  /**
   * @description Constructor de la clase abstracta.
   * Inicializa el Logger y inyecta las dependencias clave para la gestión de imágenes:
   * - imageService: Servicio para manejar la persistencia de metadatos de imágenes en la base de datos.
   * - uploadsService: Servicio para manejar la subida y eliminación de archivos físicos en el proveedor de almacenamiento (e.g., Cloudinary, S3).
   * - prisma: Instancia del servicio de Prisma para la interacción directa con la base de datos, si es necesario.
   */
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
    protected readonly uploadsService: UploadsService,
    protected readonly prisma: PrismaService,
    protected readonly logger: LoggingService, // ✅ inyectado
  ) {
    this.logger.setContext('UploadsModule');

    // Servicio concreto: nombre de la clase hija
    this.logger.setService(this.constructor.name);
    this.prisma = prisma;
  }

  /**
   * @description Método protegido central que gestiona la subida de un archivo de imagen al almacenamiento
   * y luego persiste sus metadatos en la base de datos.
   * 1. Sube el archivo (`file.buffer`) al proveedor de almacenamiento usando `uploadsService.uploadFile`.
   * 2. Si falla la subida, lanza un `BadRequestException`.
   * 3. Si la subida es exitosa, extrae los metadatos (`UploadResult`).
   * 4. Persiste los metadatos en la base de datos usando `imageService.create`.
   * 5. Si falla la persistencia, intenta **revertir** la subida física del archivo (`uploadsService.deleteFile`)
   * para evitar archivos huérfanos, y lanza un `BadRequestException`.
   * @param file El archivo de imagen a subir (proporcionado por Multer).
   * @param imageType El tipo de imagen según el enum de Prisma (e.g., PROFILE, PRODUCT).
   * @param folderPath La ruta o carpeta dentro del proveedor de almacenamiento donde se guardará el archivo.
   * @param isCustomizedImage Indica si la imagen es global/personalizada (default: false).
   * @returns Una promesa que resuelve con el DTO de respuesta de la imagen creada (`ImageResponseDto`).
   */
  protected async uploadAndPersistImage(
    file: Express.Multer.File,
    imageType: ImageType,
    folderPath: string,
    isCustomizedImage = false,
    name: string,
    altText: string,
    description: string,
    tags: string[],
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
      type: imageType,
      altText,
      description,
      name,
      tags,
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
      // Rollback: Si falla la base de datos, intenta eliminar el archivo subido.
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

  /**
   * @description Método de conveniencia que llama a `uploadAndPersistImage` forzando
   * el parámetro `isCustomizedImage` a **true**.
   * Se utiliza para subir imágenes que se consideran "globales" o de uso general y
   * que no están necesariamente atadas a una entidad específica al momento de la subida,
   * o para indicar que la imagen es personalizada de alguna manera.
   * @param file El archivo de imagen a subir.
   * @param imageType El tipo de imagen.
   * @param folderPath La ruta o carpeta de almacenamiento.
   * @returns Una promesa que resuelve con el DTO de respuesta de la imagen creada.
   */
  protected async uploadAndPersistGlobalImage(
    file: Express.Multer.File,
    imageType: ImageType,
    folderPath: string,
    name: string,
    altText: string,
    description: string,
    tags: string[],
  ): Promise<ImageResponseDto> {
    return this.uploadAndPersistImage(
      file,
      imageType,
      folderPath,
      true,
      name,
      altText,
      description,
      tags,
    ); // 🔹 siempre true
  }

  /**
   * @description Método protegido que gestiona la eliminación tanto del archivo físico
   * en el proveedor de almacenamiento como de sus metadatos en la base de datos.
   * 1. Intenta eliminar el archivo físico usando `uploadsService.deleteFile` si `publicId` está presente.
   * (Se registra el error si falla la eliminación física, pero la ejecución continúa para la DB).
   * 2. Intenta eliminar los metadatos de la imagen de la base de datos usando `imageService.remove`.
   * 3. Si falla la eliminación de metadatos, se lanza la excepción.
   * @param imageId El ID de la imagen en la base de datos.
   * @param publicId El ID público del archivo en el proveedor de almacenamiento.
   * @param entityId El ID de la entidad (e.g., Usuario, Producto) a la que estaba asociada la imagen, usado solo para logging.
   * @returns Una promesa que resuelve a `void`.
   */
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
        // NOTA: Se registra el error pero NO se lanza, para permitir que se elimine el registro de la DB.
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
      throw error; // Se lanza el error si falla la eliminación del registro de la DB.
    }

    this.logger.log(
      `[BaseImageManager] Image ID: ${imageId} successfully removed for entity ${entityId}.`,
    );
  }

  /**
   * @description **Método abstracto que DEBE ser implementado por las clases concretas (hijas).**
   * Su propósito es crear el vínculo (relación) en la base de datos entre la entidad específica
   * (e.g., un `Product`, `User`) y los metadatos de la imagen recién creada.
   * @param entityId El ID de la entidad a la que se vinculará la imagen.
   * @param image El DTO de la imagen con sus metadatos.
   * @param optionalData Datos adicionales que podrían ser necesarios para crear el vínculo.
   * @returns Una promesa que resuelve a `void` una vez completada la vinculación.
   */
  protected abstract linkImageToEntity(
    entityId: string,
    image: ImageResponseDto,
    optionalData?: any,
  ): Promise<void>;

  /**
   * @description **Método abstracto que DEBE ser implementado por las clases concretas (hijas).**
   * Su propósito es eliminar el vínculo (relación) en la base de datos entre la entidad
   * y los metadatos de la imagen, sin necesariamente eliminar el archivo físico o sus metadatos principales.
   * (Aunque a menudo se usa como paso previo a `removeImageAndMetadata`).
   * @param entityId El ID de la entidad de la que se desvinculará la imagen.
   * @param imageId El ID de la imagen a desvincular.
   * @returns Una promesa que resuelve a `void` una vez completada la desvinculación.
   */
  protected abstract unlinkImageFromEntity(
    entityId: string,
    imageId: string,
  ): Promise<void>;

  /**
   * @description **Método abstracto público que DEBE ser implementado por las clases concretas (hijas).**
   * Es el punto de entrada principal para la lógica de actualización/reemplazo de una imagen asociada a una entidad.
   * Su implementación típicamente involucra:
   * 1. Buscar la imagen existente a reemplazar usando `imageId`.
   * 2. Si se proporciona un nuevo archivo (`file`), usar `uploadAndPersistImage` para subir la nueva imagen.
   * 3. Usar `removeImageAndMetadata` para eliminar la imagen antigua (física y metadatos).
   * 4. Actualizar la relación de la entidad (`entityId`) para apuntar a la nueva imagen, si corresponde.
   * 5. Aplicar cualquier otra lógica de actualización definida en `updateDto`.
   * @param entityId El ID de la entidad cuya imagen se va a actualizar.
   * @param imageId El ID de la imagen **actual** que se va a reemplazar/modificar.
   * @param file El **nuevo** archivo de imagen a subir, o `undefined` si solo se actualizan metadatos de la imagen existente.
   * @param updateDto Un DTO genérico para datos adicionales de actualización.
   * @returns Una promesa que resuelve con el DTO de respuesta de la nueva o actualizada imagen.
   */
  public abstract updateEntityImage(
    entityId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto>;
}
