// src/modules/business/controllers/business-logo.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Patch,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageResponseDto } from 'src/image/dtos/Response/image-response.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessLogoService } from '../interfaces/business-logo-service.interface';

// DTO para la actualización de metadatos del logo (sin el archivo)
// Puedes crear un archivo separado si es más complejo
class UpdateLogoMetadataDto {
  // Aquí irían los campos que se pueden actualizar en la metadata de la imagen
  // Por ejemplo, si tuvieras un campo 'altText' o 'description' en Image
  // altText?: string;
  // description?: string;
  // Los campos como url, publicId, etc., no se actualizan directamente por el cliente
}

@Controller('business/:businessId/logo')
export class BusinessLogoController {
  constructor(
    @Inject(TOKENS.IBusinessLogoService)
    private readonly businessLogoService: IBusinessLogoService)
     {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el formulario multipart
  @HttpCode(HttpStatus.CREATED)
  async uploadLogo(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageResponseDto> {
    if (!file) {
      console.log("not file")
      throw new BadRequestException('No file provided for logo upload.');
    }
    return this.businessLogoService.uploadAndAssignLogo(businessId, file);
  }

  @Get()
  async getLogo(@Param('businessId') businessId: string): Promise<ImageResponseDto> {
    const logo = await this.businessLogoService.getBusinessLogo(businessId);
    if (!logo) {
      throw new NotFoundException(`Logo not found for business ID "${businessId}".`);
    }
    return logo;
  }

  @Patch()
  @UseInterceptors(FileInterceptor('file'))
  async updateLogo(
    @Param('businessId') businessId: string,
    @UploadedFile() file: Express.Multer.File | undefined, // 'undefined' si no se sube un nuevo archivo
    @Body() updateDto: UpdateLogoMetadataDto, // Metadatos adicionales para actualizar
  ): Promise<ImageResponseDto> {
    // Necesitas obtener el ID del logo actual para pasarlo al servicio
    const currentLogo = await this.businessLogoService.getBusinessLogo(businessId);
    if (!currentLogo) {
      throw new NotFoundException(`No logo found to update for business ID "${businessId}".`);
    }
    return this.businessLogoService.updateEntityImage(businessId, currentLogo.id, file, updateDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLogo(@Param('businessId') businessId: string): Promise<void> {
    await this.businessLogoService.removeBusinessLogo(businessId);
  }
}