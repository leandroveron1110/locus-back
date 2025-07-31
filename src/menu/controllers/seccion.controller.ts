import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISeccionService } from '../interfaces/seccion-service.interface';
import { SeccionCreateDto, SeccionUpdateDto } from '../dtos/request/seccion.request.dto';

@Controller('secciones')
export class SeccionController {
  constructor(
    @Inject(TOKENS.ISeccionService)
    private readonly seccionService: ISeccionService,
  ) {}

  @Post()
  async create(@Body() dto: SeccionCreateDto) {
    return this.seccionService.createSeccion(dto);
  }

  @Get()
  async findAllByMenu(@Query('menuId') menuId: string) {
    return this.seccionService.findAllByMenuId(menuId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.seccionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: SeccionUpdateDto) {
    return this.seccionService.updateSeccion(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.seccionService.deleteSeccion(id);
  }
}
