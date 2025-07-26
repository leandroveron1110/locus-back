// src/controllers/searchable-business-tag.controller.ts
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
import { ISearchableTagCrudService } from '../interfaces/searchable-tag-crud-service.interface'; // Asegúrate de que la ruta sea correcta
import { TagsDto } from '../dtos/request/tag.dto';

@Controller('admin/businesses/:id/tags') // Ruta base para este controlador, anidado bajo el ID del negocio
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Habilita la validación
export class SearchableBusinessTagController {
  private readonly logger = new Logger(SearchableBusinessTagController.name);

  constructor(
    @Inject(TOKENS.ISearchableTagCrudService) // Inyecta el servicio de CRUD de tags
    private readonly searchTagCrudService: ISearchableTagCrudService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content es común para operaciones que no devuelven cuerpo
  async addTags(
    @Param('id') id: string,
    @Body() addTagsDto: TagsDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para añadir tags a negocio ${id}: ${addTagsDto.tags.join(', ')}`,
    );
    await this.searchTagCrudService.addTagToBusiness(id, addTagsDto.tags);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async setTags(
    @Param('id') id: string,
    @Body() setTagsDto: TagsDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para establecer tags para negocio ${id}: ${setTagsDto.tags.join(', ')}`,
    );
    await this.searchTagCrudService.setTagsForBusiness(id, setTagsDto.tags);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTags(
    @Param('id') id: string,
    @Body() removeTagsDto: TagsDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para eliminar tags de negocio ${id}: ${removeTagsDto.tags.join(', ')}`,
    );
    await this.searchTagCrudService.deleteTagToBusiness(id, removeTagsDto.tags);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getTags(@Param('id') id: string): Promise<string[]> {
    this.logger.log(`Recibida petición para obtener tags de negocio ${id}`);
    // Asumo que tienes un método 'getTagsForBusiness' en tu SearchTagCrudService
    // Si no lo tienes, deberías añadirlo a la interfaz y la implementación.
    // Por ahora, lo dejo comentado o lo implementas si es necesario.
    // return this.searchTagCrudService.getTagsForBusiness(id);
    // Para que compile, devolveré un array vacío temporalmente.
    return []; // Reemplaza esto con la llamada real a tu servicio
  }
}
