// src/option/option.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
} from '@nestjs/common';
import { OptionService } from '../services/option.service';
import { CreateOpcionDto } from '../dtos/request/opcion-request.dto';

@Controller('options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  // Crear una opción
  @Post()
  async create(@Body() dto: CreateOpcionDto) {
    return await this.optionService.create(dto);
  }

  // Actualizar una opción (PATCH recomendado para actualización parcial)
  @Patch(':id')
  async update(
    @Param('id') optionId: string,
    @Body() dto: Partial<CreateOpcionDto>,
  ) {
    return await this.optionService.update(optionId, dto);
  }

  // Buscar todas las opciones de un grupo
  @Get('group/:groupId')
  async findAllByGroup(@Param('groupId') groupId: string) {
    return await this.optionService.findAllByGroup(groupId);
  }

  // Eliminar opción
  @Delete('multiple')
  async deleteMany(@Body() body: { ids: string[] }) {
    return await this.optionService.deleteMany(body.ids);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.optionService.delete(id);
  }
}
