// src/business/controllers/business-category.controller.ts
import {
  Body,
  Controller,
  Param,
  Patch,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';
import { TOKENS } from 'src/common/constants/tokens';
import { IsArray, IsUUID } from 'class-validator';
import { IBusinessCategoryService } from '../interfaces/business-category.interface';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionEnum, UserRole } from '@prisma/client';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';

class UpdateBusinessCategoriesDto {
  @IsArray()
  @IsUUID('all', { each: true }) // Valida que cada ID sea un UUID válido
  categoryIds: string[];
}

@Controller('business/:businessId/categories') // Ruta anidada bajo /business
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validacion a nivel de controlador
export class BusinessCategoryController {
  constructor(
    @Inject(TOKENS.IBusinessCategoryService)
    private readonly businessCategoryService: IBusinessCategoryService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK) // Indica que la operación fue exitosa
  @Roles(UserRole.OWNER)
  @Permissions(PermissionEnum.EDIT_BUSINESS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async updateBusinessCategories(
    @Param('businessId', UuidParam) businessId: string,
    @Body() updateDto: UpdateBusinessCategoriesDto, // updateDto contendrá { categoryIds: string[] }
  ) {
    // Delega la lógica al servicio
    await this.businessCategoryService.associateBusinessWithCategories(
      businessId,
      updateDto.categoryIds,
    );
    return { message: 'Business categories updated successfully.' };
  }

  @Get('category')
  @Public()
  async getBusinessCategories(@Param('businessId', UuidParam) businessId: string) {
    return this.businessCategoryService.getCategoriesByBusinessId(businessId);
  }


}
