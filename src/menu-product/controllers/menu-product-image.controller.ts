// controllers/menu-product-image.controller.ts
import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Patch,
} from '@nestjs/common';
import { MenuProductImageService } from '../services/menu-product-image.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { LinkMenuProductImageDto } from '../dtos/request/menu-product-image-request.dto';

@Controller('menu-product-images')
export class MenuProductImageController {
  constructor(private readonly service: MenuProductImageService) {}


  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('menuProductId') menuProductId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.service.uploadAndAssignImage(menuProductId, file);
  }

  @Delete()
  async removeImage(
    @Param('menuProductId') menuProductId: string,
  ): Promise<void> {
    return this.service.removeProductImage(menuProductId);
  }

  @Patch(':imageId')
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @Param('menuProductId') menuProductId: string,
    @Param('imageId') imageId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<ImageResponseDto> {
    return this.service.updateEntityImage(menuProductId, imageId, file, body);
  }

  @Post('link')
  async linkExistingImage(
    @Body() dto: LinkMenuProductImageDto,
  ): Promise<void> {
    return this.service.linkImageToMenuProduct(dto);
  }
}
