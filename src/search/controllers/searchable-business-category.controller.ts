// src/controllers/searchable-business-category.controller.ts
import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Inject,
  Logger,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens'; // Asegúrate de que la ruta sea correcta
import { ISearchableCategoryCrudService } from '../interfaces/searchable-category-crud-service.interface'; // Asegúrate de que la ruta sea correcta
import { CategoriesDto } from '../dtos/request/categories.dto';

@Controller('admin/businesses/:id/categories') // Ruta base para este controlador, anidado bajo el ID del negocio
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Habilita la validación
export class SearchableBusinessCategoryController {
  private readonly logger = new Logger(SearchableBusinessCategoryController.name);

  constructor(
    @Inject(TOKENS.ISearchCategoryCrudService) // Inyecta el servicio de CRUD de categorías
    private readonly searchCategoryCrudService: ISearchableCategoryCrudService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content es común para operaciones que no devuelven cuerpo
  async addCategories(
    @Param('id') id: string,
    @Body() addCategoriesDto: CategoriesDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para añadir categorías a negocio ${id}: ${addCategoriesDto.categories.join(', ')}`,
    );
    await this.searchCategoryCrudService.addCategoryToBusiness(
      id,
      addCategoriesDto.categories,
    );
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async setCategories(
    @Param('id') id: string,
    @Body() setCategoriesDto: CategoriesDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para establecer categorías para negocio ${id}: ${setCategoriesDto.categories.join(', ')}`,
    );
    await this.searchCategoryCrudService.setCategoriesForBusiness(
      id,
      setCategoriesDto.categories,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCategories(
    @Param('id') id: string,
    @Body() removeCategoriesDto: CategoriesDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para eliminar categorías de negocio ${id}: ${removeCategoriesDto.categories.join(', ')}`,
    );
    await this.searchCategoryCrudService.deleteCategoryToBusiness(
      id,
      removeCategoriesDto.categories,
    );
  }
}
