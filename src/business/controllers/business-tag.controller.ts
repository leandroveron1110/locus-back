// src/business/controllers/business-tag.controller.ts
import {
  Body,
  Controller,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Inject,
  Post,
  Patch, // Necesitamos Inject para el token
} from '@nestjs/common';
import { IBusinessTagService } from '../interfaces/business-tag.interface'; // Asegúrate de la ruta
import { TOKENS } from 'src/common/constants/tokens'; // Asegúrate de la ruta
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';
import { IsArray, IsUUID } from 'class-validator';
import { BusinessTagResponseDto } from '../dto/Response/business-tag-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionEnum, UserRole } from '@prisma/client';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';

class UpdateBusinessTagsDto {
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada ID sea un UUID válido
  tagIds: string[];
}

@Controller('business/:businessId/tags') // Ruta anidada bajo /businesses
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validacion a nivel de controlador
export class BusinessTagController {
  constructor(
    @Inject(TOKENS.IBusinessTagService) // Inyectamos el servicio usando su token
    private readonly businessTagService: IBusinessTagService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER)
  @Permissions(PermissionEnum.EDIT_BUSINESS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async updateBusinessTags(
    @Param('businessId', UuidParam) businessId: string, // Usa tu pipe UuidParam
    @Body() updateDto: UpdateBusinessTagsDto, // updateDto contendrá { tagIds: string[] }
  ): Promise<{ message: string }> {
    await this.businessTagService.associateBusinessWithTags(
      businessId,
      updateDto.tagIds,
    );
    return { message: 'Business tags updated successfully.' };
  }

  @Get('tags')
  @Public()
  @HttpCode(HttpStatus.OK) // 200 OK para una consulta exitosa
  async getBusinessTags(
    @Param('businessId', UuidParam) businessId: string,
  ): Promise<BusinessTagResponseDto[]> {
    // El tipo de retorno es BusinessTagDetails[]
    return this.businessTagService.getTagsByBusinessId(businessId);
  }
}
