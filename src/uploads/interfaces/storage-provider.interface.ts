// src/modules/interfaces/storage-provider.interface.ts

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  resourceType?: string;
  width?: number;
  height?: number;
  bytes?: BigInt;
  folder?: string;
}

export interface IStorageProvider {
  uploadFile(fileBuffer: Buffer, originalFileName: string, folderPath: string, contentType: string): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';