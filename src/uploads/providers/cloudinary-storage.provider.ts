// src/modules/uploads/providers/cloudinary-storage.provider.ts

import { Injectable } from '@nestjs/common'; 
import { v2 as cloudinary } from 'cloudinary';
import {
  IStorageProvider,
  UploadResult,
} from '../interfaces/storage-provider.interface';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  constructor(
    private readonly logger: LoggingService // Asumo que el LoggingService está disponible
  ) {
    this.logger.setService(CloudinaryStorageProvider.name)
    this.logger.setContext("Uploads");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * 📤 Sube un archivo (buffer) a Cloudinary.
   * * NOTA: Se espera que el 'fileBuffer' ya haya sido procesado (ej. a WebP) 
   * y que 'contentType' refleje el formato final (ej. 'image/webp').
   * Se elimina la validación de tipo de archivo y la opción 'format: webp'.
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    folderPath: string,
    contentType: string,
  ): Promise<UploadResult> {
    this.logger.log(
      `Attempting to upload file "${originalFileName}" (${contentType}) to Cloudinary folder "${folderPath}"`,
    );

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folderPath,
            resource_type: 'image', // Forzamos 'image' ya que el UploadsService valida que sea una imagen
            public_id: `${originalFileName.split('.')[0]}_${Date.now()}`,
            // 🛑 'format' y cualquier otra opción de transformación se elimina
          },
          (error, result) => {
            if (error) {
              this.logger.error(
                `Cloudinary upload failed: ${error.message}`,
                error.stack,
              );
              return reject(
                new Error(`Cloudinary upload failed: ${error.message}`),
              );
            }
            if (!result) {
              this.logger.error(`Cloudinary upload returned no result.`);
              return reject(new Error('Cloudinary upload returned no result.'));
            }

            this.logger.log(
              `File uploaded to Cloudinary: ${result.secure_url} with publicId: ${result.public_id}`,
            );
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              resourceType: result.resource_type,
              width: result.width,
              height: result.height,
              bytes: BigInt(result.bytes),
              folder: result.folder,
            });
          },
        )
        .end(fileBuffer);
    });
  }

  /**
   * 🗑️ Elimina un archivo de Cloudinary usando su publicId.
   */
  async deleteFile(publicId: string): Promise<void> {
    this.logger.log(
      `Attempting to delete file from Cloudinary with publicId: ${publicId}`,
    );
    try {
      // Se asume 'image' ya que es lo que maneja este servicio
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
      if (result.result !== 'ok') {
        this.logger.warn(
          `Cloudinary deletion for publicId ${publicId} returned: ${result.result}`,
        );
        throw new Error(
          `Failed to delete file from Cloudinary: ${result.result}`,
        );
      }
      this.logger.log(
        `Successfully deleted file from Cloudinary with publicId: ${publicId}. Result: ${result.result}`,
      );
    } catch (error) {
      this.logger.error(
        `Cloudinary deletion failed for publicId ${publicId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
  }
}