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
  NotFoundException, // Asegúrate de importar NotFoundException
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

// DTO para la actualización de metadatos de la imagen de galería
class UpdateGalleryImageDto {
  order?: number;
  // Puedes añadir otros campos de metadatos si tu modelo Image los soporta
  // altText?: string;
  // description?: string;
}

@ApiTags('Business Gallery Images')
// CAMBIO CLAVE AQUÍ: La ruta incluye el businessId
@Controller('businesses/:businessId/gallery')
export class BusinessGalleryController {
  constructor(
    private readonly businessGalleryService: BusinessGalleryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a new image to a business gallery' })
  // @ApiParam ya no es necesario aquí si businessId está en el @Controller
  // PERO lo mantenemos para Swagger para que se documente el parámetro de la ruta base
  @ApiParam({
    name: 'businessId',
    description: 'ID of the business',
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        order: {
          type: 'number',
          nullable: true,
          description: 'Optional order for the image in the gallery.',
        },
      },
    },
    description: 'Image file for the gallery.',
  })
  @ApiQuery({
    // Mantén ApiQuery para el parámetro 'order' si sigue siendo un query param
    name: 'order',
    required: false,
    type: Number,
    description: 'Optional order for the image in the gallery.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image successfully added to gallery.',
    type: ImageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Business not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or upload error.',
  })
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
  @ApiOperation({ summary: 'Get all gallery images for a business' })
  @ApiParam({
    name: 'businessId',
    description: 'ID of the business',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of gallery images.',
    type: [ImageResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Business not found.',
  })
  async getGalleryImages(
    @Param('businessId') businessId: string,
  ): Promise<ImageResponseDto[]> {
    return this.businessGalleryService.getImagesForEntity(businessId);
  }

  @Patch(':imageId')
  @ApiOperation({
    summary:
      'Update a specific gallery image (replace file or update metadata/order)',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID of the business',
    type: String,
  })
  @ApiParam({
    name: 'imageId',
    description: 'ID of the gallery image to update',
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          nullable: true,
        },
        order: {
          type: 'number',
          nullable: true,
          description: 'New order for the image in the gallery.',
        },
      },
    },
    description: 'New image file (optional) and/or metadata to update.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gallery image successfully updated.',
    type: ImageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Business or image not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or update error.',
  })
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
  @ApiOperation({ summary: 'Remove a specific image from a business gallery' })
  @ApiParam({
    name: 'businessId',
    description: 'ID of the business',
    type: String,
  })
  @ApiParam({
    name: 'imageId',
    description: 'ID of the gallery image to remove',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Gallery image successfully removed.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Business or image not found in gallery.',
  })
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
