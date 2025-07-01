// src/modules/uploads/uploads.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider, STORAGE_PROVIDER, UploadResult } from '../interfaces/storage-provider.interface';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadFile(fileBuffer: Buffer, originalFileName: string, folderPath: string, contentType: string = 'application/octet-stream'): Promise<UploadResult> {
    return this.storageProvider.uploadFile(fileBuffer, originalFileName, folderPath, contentType);
  }

  async deleteFile(publicId: string): Promise<void> {
    return this.storageProvider.deleteFile(publicId);
  }
}