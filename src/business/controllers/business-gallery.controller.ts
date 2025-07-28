// src/modules/business/controllers/business-gallery.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param, // Sigue usando Param
  UploadedFile,
  UseInterceptors,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
  Query,
  ParseIntPipe,
  Optional,
  BadRequestException, // Asegúrate de importar BadRequestException
  NotFoundException,
  Inject, // Asegúrate de importar NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BusinessGalleryService } from '../services/images/business-gallery.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessGalleryService } from '../interfaces/business-gallery.interface';

// DTO para la actualización de metadatos de la imagen de galería
class UpdateGalleryImageDto {
  order?: number;
  // Puedes añadir otros campos de metadatos si tu modelo Image los soporta
  // altText?: string;
  // description?: string;
}

@Controller('businesses/:businessId/gallery')
export class BusinessGalleryController {
  constructor(
    @Inject(TOKENS.IBusinessGalleryService)
    private readonly businessGalleryService: IBusinessGalleryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async addGalleryImage(
    // businessId se obtiene de la URL base del controlador
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
    @Optional() @Query('order', ParseIntPipe) order?: number,
  ): Promise<ImageResponseDto> {
    console.log('impacta');
    if (!file) {
      throw new BadRequestException(
        'No file provided for gallery image upload.',
      );
    }
    return this.businessGalleryService.uploadAndAddGalleryImage(
      businessId,
      file,
      order,
    );
  }

  @Get()
  async getGalleryImages(
    @Param('businessId') businessId: string,
  ): Promise<ImageResponseDto[]> {
    return this.businessGalleryService.getImagesForEntity(businessId);
  }

    @Get()
  async getSimpleGalleryForEntity(
    @Param('simple/businessId') businessId: string,
  ): Promise<{ id: string; url: string }[]> {
    return this.businessGalleryService.getSimpleGalleryForEntity(businessId);
  }

  @Patch(':imageId')
  @UseInterceptors(FileInterceptor('file'))
  async updateGalleryImage(
    @Param('businessId') businessId: string,
    @Param('imageId') imageId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() updateDto: UpdateGalleryImageDto,
  ): Promise<ImageResponseDto> {
    return this.businessGalleryService.updateEntityImage(
      businessId,
      imageId,
      file,
      updateDto,
    );
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGalleryImage(
    @Param('businessId') businessId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    await this.businessGalleryService.removeGalleryImageFromBusiness(
      businessId,
      imageId,
    );
  }
}
