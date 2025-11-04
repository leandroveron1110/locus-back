import { Injectable } from '@nestjs/common';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { ImageType } from '@prisma/client';
import { UploadGlobalImageCommandHandler } from './cqrs/command/UploadGlobalImageCommandHandler';
import { FindGlobalImagesQueryHandler } from './cqrs/query/FindGlobalImagesQueryHandler';
import { FindGlobalImagesQueryDto } from '../dto/request/search-global-image.dto';

@Injectable()
export class UploadsImageGlobalService {
  // El servicio solo inyecta los Handlers
  constructor(
    private readonly commandHandler: UploadGlobalImageCommandHandler,
    private readonly queryHandler: FindGlobalImagesQueryHandler,
  ) {}

  // --- MÉTODOS PÚBLICOS (DELEGACIÓN) ---

  uploadGlobalImage(
    file: Express.Multer.File,
    folderPath: string,
    imageType: ImageType = ImageType.GENERAL,
    name: string,
    altText: string,
    description: string,
    tags: string[],
  ): Promise<ImageResponseDto> {
    // Delega al Command Handler
    return this.commandHandler.uploadGlobalImage(
      file,
      folderPath,
      imageType,
      name,
      altText,
      description,
      tags,
    );
  }

  removeGlobalImage(imageId: string): Promise<void> {
    // Delega al Command Handler
    return this.commandHandler.removeGlobalImage(imageId);
  }

  findAllGlobalImages(queryDto: FindGlobalImagesQueryDto) {
    // Delega al Query Handler
    return this.queryHandler.execute(queryDto);
  }
}
