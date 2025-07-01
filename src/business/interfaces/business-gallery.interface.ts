// src/modules/business/interfaces/business-gallery-service.interface.ts
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { ImageDto } from './image.interface';

export interface IBusinessGalleryService {
  uploadAndAddGalleryImage(
    businessId: string,
    file: Express.Multer.File,
    order?: number,
  ): Promise<ImageResponseDto>;

  getImagesForEntity(businessId: string): Promise<ImageResponseDto[]>;

  updateEntityImage(
    businessId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: ImageDto,
  ): Promise<ImageResponseDto>;

  removeGalleryImageFromBusiness(
    businessId: string,
    imageId: string,
  ): Promise<void>;
}
