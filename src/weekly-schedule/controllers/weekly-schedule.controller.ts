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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('weekly-schedules') // Prefijo de ruta
export class WeeklyScheduleController {
  constructor(
    @Inject(TOKENS.IWeeklyScheduleService)
    private readonly weeklyScheduleService: IWeeklyScheduleService,
  ) {}

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

  @Post(':idBusiness')
  @HttpCode(204)
  @Roles(UserRole.OWNER)
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

  @Put(':idBusiness/daily/:day')
  @HttpCode(204)
  @Roles(UserRole.OWNER)
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

  @Post(':idBusiness/daily/:day')
  @HttpCode(204)
  @Roles(UserRole.OWNER)
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


  @Delete(':idBusiness/daily/:day')
  @HttpCode(204)
  @Roles(UserRole.OWNER)
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

  @Delete(':idBusiness/:day')
  @HttpCode(204)
  @Roles(UserRole.OWNER)
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