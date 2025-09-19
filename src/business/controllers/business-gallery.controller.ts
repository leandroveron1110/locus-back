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
  Inject,
  DefaultValuePipe, // Asegúrate de importar NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessGalleryService } from '../interfaces/business-gallery.interface';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { BusinessPermissions } from 'src/common/enums/rolees-permissions';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';

// DTO para la actualización de metadatos de la imagen de galería
class UpdateGalleryImageDto {
  order?: number;
  // Puedes añadir otros campos de metadatos si tu modelo Image los soporta
  // altText?: string;
  // description?: string;
}

@Controller('business/:businessId/gallery')
export class BusinessGalleryController {
  constructor(
    @Inject(TOKENS.IBusinessGalleryService)
    private readonly businessGalleryService: IBusinessGalleryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.OWNER)
  async addGalleryImage(
    // businessId se obtiene de la URL base del controlador
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('order', new DefaultValuePipe(0), ParseIntPipe) order: number,
  ): Promise<ImageResponseDto> {
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
  @Public()
  async getGalleryImages(@Param('businessId') businessId: string): Promise<
    {
      id: string;
      url: string;
      order: number;
    }[]
  > {
    return await this.businessGalleryService.getSimpleGalleryForEntity(businessId);
  }

  @Get()
  async getSimpleGalleryForEntity(
    @Param('simple/businessId') businessId: string,
  ): Promise<{ id: string; url: string; order: number }[]> {
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
  @Roles(UserRole.OWNER)
  @Permissions(BusinessPermissions.EDIT_BUSINESS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ALL_PERMISSIONS)
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
