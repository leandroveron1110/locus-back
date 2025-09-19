// src/modules/weekly-schedule/weekly-schedule.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Inject,
  NotFoundException,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IWeeklyScheduleService } from '../interface/weekly-schedule-service.interface';
import { WeeklyScheduleStructure } from '../types/WeeklySchedule';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('weekly-schedules') // Prefijo de ruta
export class WeeklyScheduleController {
  constructor(
    @Inject(TOKENS.IWeeklyScheduleService)
    private readonly weeklyScheduleService: IWeeklyScheduleService,
  ) {}

  /**
   * Obtiene el horario semanal completo de un negocio.
   * GET /weekly-schedules/:idBusiness
   */
  @Get(':idBusiness')
  @Public()
  async getWeeklySchedule(@Param('idBusiness') idBusiness: string) {
    const schedule = await this.weeklyScheduleService.getWeeklySchedule(
      idBusiness,
    );
    if (!schedule) {
      throw new NotFoundException(
        `No se encontró un horario para el negocio con ID ${idBusiness}.`,
      );
    }
    return schedule;
  }

  /**
   * Reemplaza (establece) el horario semanal completo de un negocio.
   * POST /weekly-schedules/:idBusiness
   */
  @Post(':idBusiness')
  @HttpCode(204) // No Content, ya que la respuesta no necesita cuerpo
  async setWeeklySchedule(
    @Param('idBusiness') idBusiness: string,
    @Body() body: WeeklyScheduleStructure, // Aquí puedes usar un DTO más específico si lo necesitas
  ) {
    try {
      await this.weeklyScheduleService.setWeeklySchedule(idBusiness, body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Actualiza los horarios de un día específico.
   * PUT /weekly-schedules/:idBusiness/daily/:day
   */
  @Put(':idBusiness/daily/:day')
  @HttpCode(204)
  async updateDailySchedule(
    @Param('idBusiness') idBusiness: string,
    @Param('day') day: string,
    @Body() body: { timeRanges: string[] },
  ) {
    try {
      await this.weeklyScheduleService.updateDailySchedule(
        idBusiness,
        day,
        body.timeRanges,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Añade un nuevo rango de tiempo a un día específico.
   * POST /weekly-schedules/:idBusiness/daily/:day
   */
  @Post(':idBusiness/daily/:day')
  @HttpCode(204)
  async addTimeRangeToDay(
    @Param('idBusiness') idBusiness: string,
    @Param('day') day: string,
    @Body() body: { newTimeRange: string },
  ) {
    try {
      await this.weeklyScheduleService.addTimeRangeToDay(
        idBusiness,
        day,
        body.newTimeRange,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Elimina un rango de tiempo específico de un día.
   * DELETE /weekly-schedules/:idBusiness/daily/:day
   */
  @Delete(':idBusiness/daily/:day')
  @HttpCode(204)
  async removeTimeRangeFromDay(
    @Param('idBusiness') idBusiness: string,
    @Param('day') day: string,
    @Body() body: { timeRangeToRemove: string },
  ) {
    try {
      await this.weeklyScheduleService.removeTimeRangeFromDay(
        idBusiness,
        day,
        body.timeRangeToRemove,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Elimina el horario de un día completo.
   * DELETE /weekly-schedules/:idBusiness/:day
   */
  @Delete(':idBusiness/:day')
  @HttpCode(204)
  async deleteDailySchedule(
    @Param('idBusiness') idBusiness: string,
    @Param('day') day: string,
  ) {
    try {
      await this.weeklyScheduleService.deleteDailySchedule(idBusiness, day);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}