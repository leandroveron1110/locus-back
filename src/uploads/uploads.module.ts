// src/modules/uploads/uploads.module.ts
import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider'; // Importa tu proveedor actual
import { UploadsService } from './services/uploads.service';
import { LoggingModule } from 'src/logging/logging.module';
import { ImageProcessingService } from './services/image-processing.service';

@Module({
  providers: [
    UploadsService,
    {
      provide: STORAGE_PROVIDER,
      useClass: CloudinaryStorageProvider, // Usa la implementación de Cloudinary
    },
    ImageProcessingService
  ],
  exports: [UploadsService],
  imports: [LoggingModule]
})
export class UploadsModule {}