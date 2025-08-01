// controllers/menu-product-image.controller.ts
import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenuProductImageService } from '../services/menu-product-image.service';
import { CreateMenuProductImageDto } from '../dtos/request/menu-product-image-request.dto';

@Controller('menu-product-images')
export class MenuProductImageController {
  constructor(private readonly service: MenuProductImageService) {}

  @Post()
  async create(@Body() dto: CreateMenuProductImageDto) {
    return this.service.create(dto);
  }

  @Delete(':menuProductId/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('menuProductId') menuProductId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.service.remove(menuProductId, imageId);
  }
}
