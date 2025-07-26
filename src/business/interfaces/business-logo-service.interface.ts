import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';

export interface IBusinessLogoService {
  uploadAndAssignLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<ImageResponseDto>;

  getBusinessLogo(businessId: string | null): Promise<ImageResponseDto | null>;

  getImagesForEntity(businessId: string): Promise<ImageResponseDto[]>;

  removeBusinessLogo(businessId: string): Promise<void>;

  updateEntityImage(
    businessId: string,
    imageId: string,
    file: Express.Multer.File | undefined,
    updateDto: any,
  ): Promise<ImageResponseDto>;
}
