// src/modules/status/status.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { StatusService } from '../services/status.service';
import { CreateStatusDto } from '../dtos/Request/create-status.dto';
import { StatusResponseDto } from '../dtos/Response/status-response.dto';
import { UpdateStatusDto } from '../dtos/Request/update-status.dto';


@Controller('statuses') // Prefijo de ruta para este controlador (plural)
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  create(@Body() createStatusDto: CreateStatusDto): Promise<StatusResponseDto> {
    return this.statusService.create(createStatusDto);
  }

  // @Get()
  // @HttpCode(HttpStatus.OK)
  // // Permite filtrar estados por tipo de entidad (ej. /statuses?entityType=BUSINESS)
  // findAll(@Query('entityType') entityType?: string): Promise<StatusResponseDto[]> {
  //   return this.statusService.findAll(entityType);
  // }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<StatusResponseDto> {
    return this.statusService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto): Promise<StatusResponseDto> {
    return this.statusService.update(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param('id') id: string): Promise<void> {
    return this.statusService.remove(id);
  }
}