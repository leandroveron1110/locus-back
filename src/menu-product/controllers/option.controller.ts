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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  // Crear una opción
  @Post()
  @Roles(UserRole.OWNER)
  async create(@Body() dto: CreateOpcionDto) {
    return await this.optionService.create(dto);
  }

  // Actualizar una opción (PATCH recomendado para actualización parcial)
  @Patch(':id')
  @Roles(UserRole.OWNER)
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
  @Roles(UserRole.OWNER)
  async deleteMany(@Body() body: { ids: string[] }) {
    return await this.optionService.deleteMany(body.ids);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async delete(@Param('id') id: string) {
    return await this.optionService.delete(id);
  }
}
