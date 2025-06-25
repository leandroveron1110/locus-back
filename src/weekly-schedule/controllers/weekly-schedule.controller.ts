// src/modules/weekly-schedule/weekly-schedule.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { DayOfWeek } from '@prisma/client'; // Importa el Enum
import { WeeklyScheduleService } from '../service/weekly-schedule.service';
import { CreateWeeklyScheduleDto } from '../dtos/Request/create-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../dtos/Response/weekly-schedule-response.dto';
import { UpdateWeeklyScheduleDto } from '../dtos/Request/update-weekly-schedule.dto';

@Controller('weekly-schedules') // Prefijo de ruta
export class WeeklyScheduleController {
  constructor(private readonly weeklyScheduleService: WeeklyScheduleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  create(@Body() createWeeklyScheduleDto: CreateWeeklyScheduleDto): Promise<WeeklyScheduleResponseDto> {
    return this.weeklyScheduleService.create(createWeeklyScheduleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  // Permite filtrar por businessId y/o dayOfWeek
  findAll(
    @Query('businessId') businessId?: string,
    @Query('dayOfWeek') dayOfWeek?: DayOfWeek, // El query param vendrá como string, NestJS lo mapeará si el tipo es DayOfWeek.
  ): Promise<WeeklyScheduleResponseDto[]> {
    return this.weeklyScheduleService.findAll(businessId, dayOfWeek);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<WeeklyScheduleResponseDto> {
    return this.weeklyScheduleService.findOne(id);
  }

  @Get('by-business/:businessId')
  @HttpCode(HttpStatus.OK)
  findByBusinessId(@Param('businessId') businessId: string): Promise<WeeklyScheduleResponseDto[]> {
    return this.weeklyScheduleService.findByBusinessId(businessId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateWeeklyScheduleDto: UpdateWeeklyScheduleDto): Promise<WeeklyScheduleResponseDto> {
    return this.weeklyScheduleService.update(id, updateWeeklyScheduleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param('id') id: string): Promise<void> {
    return this.weeklyScheduleService.remove(id);
  }
}