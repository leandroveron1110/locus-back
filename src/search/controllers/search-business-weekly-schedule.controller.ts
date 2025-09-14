// src/controllers/searchable-business-schedule.controller.ts
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
import { ISearchableWeeklyScheduleCrudService } from '../interfaces/searchable-weekly-schedule-crud-service.interface'; // Asegúrate de que la ruta sea correcta
import {
  SetWeeklyScheduleDto,
  UpdateDailyScheduleDto,
  AddTimeRangeToDayDto,
  RemoveTimeRangeFromDayDto,
} from '../dtos/request/weekly-schedule.dto'; // Importa los DTOs de horarios
import { WeeklyScheduleStructure } from '../types/WeeklySchedule';

@Controller('admin/businesses/:id/schedule') // Ruta base para este controlador
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Habilita la validación
export class SearchableBusinessScheduleController {
  private readonly logger = new Logger(
    SearchableBusinessScheduleController.name,
  );

  constructor(
    @Inject(TOKENS.ISearchableWeeklyScheduleCrudService) // Inyecta el servicio de CRUD de horarios
    private readonly weeklyScheduleCrudService: ISearchableWeeklyScheduleCrudService,
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content es común para reemplazos exitosos
  async setWeeklySchedule(
    @Param('id') id: string,
    @Body() setScheduleDto: SetWeeklyScheduleDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para establecer horario semanal para negocio ${id}`,
    );
    await this.weeklyScheduleCrudService.setWeeklySchedule(
      id,
      setScheduleDto.schedule,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getWeeklySchedule(
    @Param('id') id: string,
  ): Promise<WeeklyScheduleStructure | null> {
    this.logger.log(
      `Recibida petición para obtener horario semanal de negocio ${id}`,
    );
    return this.weeklyScheduleCrudService.getWeeklySchedule(id);
  }

  @Put(':day')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateDailySchedule(
    @Param('id') id: string,
    @Param('day') day: string,
    @Body() updateDailyScheduleDto: UpdateDailyScheduleDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para actualizar horario del día ${day} para negocio ${id}`,
    );
    await this.weeklyScheduleCrudService.updateDailySchedule(
      id,
      day,
      updateDailyScheduleDto.timeRanges,
    );
  }

  @Post(':day/time-ranges')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addTimeRangeToDay(
    @Param('id') id: string,
    @Param('day') day: string,
    @Body() addTimeRangeDto: AddTimeRangeToDayDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para añadir rango de tiempo a ${day} para negocio ${id}: ${addTimeRangeDto.newTimeRange}`,
    );
    await this.weeklyScheduleCrudService.addTimeRangeToDay(
      id,
      day,
      addTimeRangeDto.newTimeRange,
    );
  }

  @Delete(':day/time-ranges')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTimeRangeFromDay(
    @Param('id') id: string,
    @Param('day') day: string,
    @Body() removeTimeRangeDto: RemoveTimeRangeFromDayDto,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para eliminar rango de tiempo de ${day} para negocio ${id}: ${removeTimeRangeDto.timeRangeToRemove}`,
    );
    await this.weeklyScheduleCrudService.removeTimeRangeFromDay(
      id,
      day,
      removeTimeRangeDto.timeRangeToRemove,
    );
  }

  @Delete(':day')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDailySchedule(
    @Param('id') id: string,
    @Param('day') day: string,
  ): Promise<void> {
    this.logger.log(
      `Recibida petición para eliminar horario del día ${day} para negocio ${id}`,
    );
    await this.weeklyScheduleCrudService.deleteDailySchedule(id, day);
  }
}
