// src/modules/image/image.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ImageService } from '../services/image.service';
import { CreateImageDto } from '../dtos/Request/create-image.dto';
import { ImageResponseDto } from '../dtos/Response/image-response.dto';
import { UpdateImageDto } from '../dtos/Request/update-image.dto';


@Controller('images') // Prefijo de ruta para este controlador
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // Código de estado 201 para creación exitosa
  create(@Body() createImageDto: CreateImageDto): Promise<ImageResponseDto> {
    return this.imageService.create(createImageDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  // Opcional: permitir filtrar por businessId en la consulta (ej. /images?businessId=xyz)
  findAll(@Query('businessId') businessId?: string): Promise<ImageResponseDto[]> {
    return this.imageService.findAll(businessId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imageService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto): Promise<ImageResponseDto> {
    return this.imageService.update(id, updateImageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa sin contenido
  remove(@Param('id') id: string): Promise<void> {
    return this.imageService.remove(id);
  }

  // Rutas específicas para el logo y galería
  @Get('business/:businessId/gallery')
  @HttpCode(HttpStatus.OK)
  findGalleryByBusinessId(@Param('businessId') businessId: string): Promise<ImageResponseDto[]> {
    return this.imageService.findGalleryImagesByBusinessId(businessId);
  }

  @Get('business/:businessId/logo')
  @HttpCode(HttpStatus.OK)
  findLogoByBusinessId(@Param('businessId') businessId: string): Promise<ImageResponseDto | null> {
    return this.imageService.findLogoImageByBusinessId(businessId);
  }
}