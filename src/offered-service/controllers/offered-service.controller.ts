// src/modules/offered-service/offered-service.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { OfferedServiceService } from '../services/offered-service.service';
import { CreateOfferedServiceDto } from '../dtos/Request/create-offered-service.dto';
import { OfferedServiceResponseDto } from '../dtos/Response/offered-service-response.dto';
import { UpdateOfferedServiceDto } from '../dtos/Request/update-offered-service.dto';


@Controller('offered-services') // Prefijo de ruta
export class OfferedServiceController {
  constructor(private readonly offeredServiceService: OfferedServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  create(@Body() createOfferedServiceDto: CreateOfferedServiceDto): Promise<OfferedServiceResponseDto> {
    return this.offeredServiceService.create(createOfferedServiceDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  // Permite filtrar por businessId y/o isActive
  findAll(
    @Query('businessId') businessId?: string,
    @Query('isActive') isActive?: string, // Recibimos como string, luego lo convertimos a boolean
  ): Promise<OfferedServiceResponseDto[]> {
    // Convierte 'true'/'false' a booleano, o undefined si no está presente
    const isActiveBoolean = isActive !== undefined ? (isActive === 'true') : undefined;
    return this.offeredServiceService.findAll(businessId, isActiveBoolean);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<OfferedServiceResponseDto> {
    return this.offeredServiceService.findOne(id);
  }

  @Get('by-business/:businessId')
  @HttpCode(HttpStatus.OK)
  findByBusinessId(@Param('businessId') businessId: string): Promise<OfferedServiceResponseDto[]> {
    return this.offeredServiceService.findByBusinessId(businessId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateOfferedServiceDto: UpdateOfferedServiceDto): Promise<OfferedServiceResponseDto> {
    return this.offeredServiceService.update(id, updateOfferedServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param('id') id: string): Promise<void> {
    return this.offeredServiceService.remove(id);
  }
}