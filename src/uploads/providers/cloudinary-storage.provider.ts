// src/modules/uploads/providers/cloudinary-storage.provider.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common'; // Importamos BadRequestException
import { v2 as cloudinary } from 'cloudinary';
import {
  IStorageProvider,
  UploadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    folderPath: string,
    contentType: string,
  ): Promise<UploadResult> {
    this.logger.log(
      `Attempting to upload file "${originalFileName}" to Cloudinary folder "${folderPath}"`,
    );

    // *** VERIFICACIÓN NUEVA: Asegurarse de que el archivo sea una imagen ***
    if (!contentType.startsWith('image/')) {
      this.logger.error(
        `Attempted to upload a non-image file with contentType: ${contentType}. File: ${originalFileName}`,
      );
      throw new BadRequestException(
        'Solo se permiten subir archivos de imagen.',
      );
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folderPath,
            resource_type: 'image', // Forzamos 'image' ya que validamos arriba
            public_id: `${originalFileName.split('.')[0]}_${Date.now()}`,
            format: 'webp',
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

  async deleteFile(publicId: string): Promise<void> {
    this.logger.log(
      `Attempting to delete file from Cloudinary with publicId: ${publicId}`,
    );
    try {
      // Al eliminar, asumimos que es una imagen ya que solo permitimos subir imágenes
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
