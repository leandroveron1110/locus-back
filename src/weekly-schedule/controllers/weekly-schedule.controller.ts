// src/modules/weekly-schedule/weekly-schedule.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';
import { DayOfWeek } from '@prisma/client'; // Importa el Enum
import { CreateWeeklyScheduleDto } from '../dtos/Request/create-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../dtos/Response/weekly-schedule-response.dto';
import { UpdateWeeklyScheduleDto } from '../dtos/Request/update-weekly-schedule.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IWeeklyScheduleService } from '../interface/weekly-schedule-service.interface';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('weekly-schedules') // Prefijo de ruta
export class WeeklyScheduleController {
  constructor(
    @Inject(TOKENS.IWeeklyScheduleService)
    private readonly weeklyScheduleService: IWeeklyScheduleService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  create(
    @Body() createWeeklyScheduleDto: CreateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto> {
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
  @Get()
  @HttpCode(HttpStatus.OK)
  findAllW(): Promise<WeeklyScheduleResponseDto[]> {
    return this.weeklyScheduleService.findAllW();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<WeeklyScheduleResponseDto> {
    return this.weeklyScheduleService.findOne(id);
  }

  @Get('by-business/:businessId')
  @HttpCode(HttpStatus.OK)
  @Public()
  findByBusinessId(@Param('businessId') businessId: string): Promise<any> {
    return this.weeklyScheduleService.findByBusinessId(businessId);
  }

  @Get('panel-business/:businessId')
  @HttpCode(HttpStatus.OK)
  findPanleBusinessByBusinessId(@Param('businessId') businessId: string): Promise<any> {
    return this.weeklyScheduleService.findPanleBusinessByBusinessId(businessId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateWeeklyScheduleDto: UpdateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto> {
    return this.weeklyScheduleService.update(id, updateWeeklyScheduleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  remove(@Param('id') id: string): Promise<void> {
    return this.weeklyScheduleService.remove(id);
  }
}
