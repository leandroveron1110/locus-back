import { TOKENS } from 'src/common/constants/tokens';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ISearchableBusinessCrudService } from '../interfaces/searchable-business-crud-service.interface';
import {
  CreateBusinessDto,
  UperrBusinessDto,
} from '../dtos/request/create-business-dto';

@Controller('search/admin/businesses') // Ruta base para este controlador, sugiero 'admin' para distinguirlo
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Habilita la validación
export class SearchableBusinessController {
  private readonly logger = new Logger(SearchableBusinessController.name);

  constructor(
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly businessService: ISearchableBusinessCrudService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public createBusinessSerarch(@Body() createBusinessDto: CreateBusinessDto) {
    this.logger.log(
      `Recibida petición para crear negocio searchable con ID: ${createBusinessDto.id}`,
    );
    return this.businessService.create(createBusinessDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  public async updateBusinessSearch(
    @Param('id') id: string,
    @Body() updateBusinessDto: UperrBusinessDto,
  ): Promise<any> {
    this.logger.log(
      `Recibida petición para actualizar negocio searchable con ID: ${id}`,
    );
    if (id) {
      updateBusinessDto.id = id;
      return this.businessService.update(updateBusinessDto);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteBusinessSearch(@Param('id') id: string): Promise<void> {
    this.logger.log(
      `Recibida petición para eliminar negocio searchable con ID: ${id}`,
    );
    await this.businessService.delete(id);
  }
}
