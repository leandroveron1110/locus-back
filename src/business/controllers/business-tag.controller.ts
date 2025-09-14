// src/business/controllers/business-tag.controller.ts
import {
  Body,
  Controller,
  Param,
  Patch, // Usamos Patch para la actualización de asociaciones
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Inject,
  Post, // Necesitamos Inject para el token
} from '@nestjs/common';
import { IBusinessTagService } from '../interfaces/business-tag.interface'; // Asegúrate de la ruta
import { TOKENS } from 'src/common/constants/tokens'; // Asegúrate de la ruta
import { BusinessTagDetails } from '../services/business-tag.service'; // Importa la interfaz/tipo de retorno del servicio
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';
import { IsArray, IsUUID } from 'class-validator';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';

class UpdateBusinessTagsDto {
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada ID sea un UUID válido
  tagIds: string[];
}

@Controller('businesses/:businessId/tags') // Ruta anidada bajo /businesses
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validacion a nivel de controlador
export class BusinessTagController {
  constructor(
    @Inject(TOKENS.IBusinessTagService) // Inyectamos el servicio usando su token
    private readonly businessTagService: IBusinessTagService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK) // 200 OK para una actualización exitosa que devuelve un mensaje
  async updateBusinessTags(
    @Param('businessId', UuidParam) businessId: string, // Usa tu pipe UuidParam
    @Body() updateDto: UpdateBusinessTagsDto, // updateDto contendrá { tagIds: string[] }
  ): Promise<{ message: string }> {
    // Retorna un objeto con un mensaje
    // Delega la lógica al servicio
    console.log(updateDto);
    await this.businessTagService.associateBusinessWithTags(
      businessId,
      updateDto.tagIds,
    );
    return { message: 'Business tags updated successfully.' };
  }

  @Get('tags')
  @HttpCode(HttpStatus.OK) // 200 OK para una consulta exitosa
  async getBusinessTags(
    @Param('businessId', UuidParam) businessId: string,
  ): Promise<BusinessTagResponseDto[]> {
    // El tipo de retorno es BusinessTagDetails[]
    return this.businessTagService.getTagsByBusinessId(businessId);
  }
}
