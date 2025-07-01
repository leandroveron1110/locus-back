// src/modules/image/image.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CreateImageDto } from '../dtos/Request/create-image.dto';
import { ImageResponseDto } from '../dtos/Response/image-response.dto';
import { UpdateImageDto } from '../dtos/Request/update-image.dto';
import { IImageService } from '../interfaces/image-service.interface';
import { TOKENS } from 'src/common/constants/tokens';

@Controller('images') // Prefijo de ruta para este controlador
export class ImageController {
  constructor(
    @Inject(TOKENS.IImageService)
    protected readonly imageService: IImageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // Código de estado 201 para creación exitosa
  create(@Body() createImageDto: CreateImageDto): Promise<ImageResponseDto> {
    return this.imageService.create(createImageDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imageService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    return this.imageService.update(id, updateImageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa sin contenido
  remove(@Param('id') id: string): Promise<void> {
    return this.imageService.remove(id);
  }
}
