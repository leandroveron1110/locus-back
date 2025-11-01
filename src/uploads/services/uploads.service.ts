// src/modules/uploads/services/uploads.service.ts

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IStorageProvider,
  UploadResult,
  STORAGE_PROVIDER,
} from '../interfaces/storage-provider.interface';
import { ImageProcessingService } from './image-processing.service';

@Injectable()
export class UploadsService {
  constructor(
    // 1. Inyección del proveedor de almacenamiento (abstracto, e.g., Cloudinary o S3)
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    // 2. Inyección del servicio de procesamiento local (Sharp)
    private readonly imageProcessor: ImageProcessingService,
  ) {}

  /**
   * Sube un archivo siguiendo el flujo de procesamiento:
   * 1. Valida que el archivo sea una imagen.
   * 2. Procesa la imagen (WebP, redimensionamiento) usando ImageProcessingService.
   * 3. Almacena el buffer procesado usando el proveedor abstracto (Cloudinary/S3).
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    folderPath: string,
    contentType: string, // Tipo de contenido ORIGINAL de la subida (e.g., 'image/png')
  ): Promise<UploadResult> {
    // 1. VALIDACIÓN
    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException(
        'Solo se permiten subir archivos de imagen.',
      );
    }

    // 2. PROCESAMIENTO (Convierte localmente a WebP y redimensiona)
    let processedBuffer: Buffer;
    try {
      processedBuffer =
        await this.imageProcessor.processImageToWebP(fileBuffer);
    } catch (e) {
      // Capturamos cualquier error de Sharp y lo relanzamos como un BadRequest
      throw new BadRequestException(`Image processing failed: ${e.message}`);
    }

    // 3. ALMACENAMIENTO (El ContentType ahora siempre es 'image/webp')
    return this.storageProvider.uploadFile(
      processedBuffer,
      originalFileName,
      folderPath,
      'image/webp', // Tipo de contenido FINAL (WebP)
    );
  }

  /**
   * Elimina un archivo del proveedor de almacenamiento.
   */
  async deleteFile(publicId: string): Promise<void> {
    return this.storageProvider.deleteFile(publicId);
  }
}
