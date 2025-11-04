import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseUUIDPipe,
  BadRequestException,
  Get,
  Query, // Si usas guardias de autenticación/autorización
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { ImageType } from '@prisma/client';
import { UploadsImageGlobalService } from '../services/uploads-image-global.service';
import { CreateGlobalImageDto } from '../dto/request/create-global-image.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { FindGlobalImagesQueryDto } from '../dto/request/search-global-image.dto';

@Controller('uploads/global')
export class UploadsImageGlobalController {
  constructor(private readonly globalImageService: UploadsImageGlobalService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre de la clave en el formulario/multipart
  async uploadGlobalImage(
    @UploadedFile() file: Express.Multer.File,
    // Podrías usar un DTO para validar imageType y folderPath
    @Body() body: CreateGlobalImageDto,
  ): Promise<ImageResponseDto> {
    // **Validación básica de archivo**
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (typeof body.tags === 'string') {
      try {
        body.tags = JSON.parse(body.tags);
      } catch (error) {
        throw new BadRequestException('tags must be a valid JSON array');
      }
    }

    // Aquí convertimos la cadena ImageType a Enum si es necesario, o lo validamos
    const imageType: ImageType = body.imageType || ImageType.GENERAL;

    // Se recomienda usar un folderPath específico para globales
    const folderPath = body.folderPath || 'global-catalog/general';

    return this.globalImageService.uploadGlobalImage(
      file,
      folderPath,
      imageType,
      body.name,
      body.altText,
      body.description,
      body.tags,
    );
  }

  @Get()
  @Public()
  async findAllGlobalImages(@Query() queryDto: FindGlobalImagesQueryDto) {
    return this.globalImageService.findAllGlobalImages(queryDto);
  }

  @Delete(':imageId')
  async removeGlobalImage(
    @Param('imageId', ParseUUIDPipe) imageId: string, // Asegura que el ID sea un UUID
  ): Promise<{ message: string }> {
    await this.globalImageService.removeGlobalImage(imageId);

    return {
      message: `Global image with ID ${imageId} successfully removed.`,
    };
  }
}
