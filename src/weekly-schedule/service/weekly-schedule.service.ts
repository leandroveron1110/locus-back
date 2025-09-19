// src/modules/weekly-schedule/weekly-schedule.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IWeeklyScheduleService } from '../interface/weekly-schedule-service.interface';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';
import { WeeklyScheduleStructure } from 'src/search/types/WeeklySchedule';
import { ISearchableWeeklyScheduleCrudService } from 'src/search/interfaces/searchable-weekly-schedule-crud-service.interface';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class WeeklyScheduleService implements IWeeklyScheduleService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IBusinessValidator)
    private searchBusines: IExistenceValidator,
    @Inject(TOKENS.ISearchableWeeklyScheduleCrudService)
    private searchableWeeklyScheduleCrudService: ISearchableWeeklyScheduleCrudService,
  ) {}

  // ➡️ Métodos delegados y sincronizados
  /**
   * Establece (reemplaza completamente) el horario semanal para un negocio y lo sincroniza con el buscador.
   * @param idBusiness El ID del negocio.
   * @param schedule El objeto de horario semanal a establecer.
   */
  async setWeeklySchedule(
    idBusiness: string,
    schedule: WeeklyScheduleStructure,
  ): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);

    try {
      const scheduleJsonString = JSON.stringify(schedule);

      await this.prisma.business.update({
        where: { id: idBusiness },
        data: {
          horarios: scheduleJsonString,
        },
      });

      // 🔑 Sincronizar el buscador
      await this.searchableWeeklyScheduleCrudService.setWeeklySchedule(
        idBusiness,
        schedule,
      );

      console.log(`Horario semanal establecido para el negocio ${idBusiness}.`);
    } catch (error) {
      console.error(
        `Error al establecer el horario semanal para el negocio ${idBusiness}:`,
        error,
      );
      throw new Error(`No se pudo establecer el horario semanal.`);
    }
  }

  /**
   * Obtiene el horario semanal para un negocio.
   * Nota: Este método lee de la base de datos principal.
   * @param idBusiness El ID del negocio.
   * @returns El objeto de horario semanal o null si no se encuentra.
   */
  async getWeeklySchedule(
    idBusiness: string,
  ): Promise<WeeklyScheduleStructure | null> {
    const business = await this.prisma.business.findUnique({
      where: { id: idBusiness },
      select: { horarios: true },
    });

    if (!business || !business.horarios) {
      console.log(`No se encontró horario semanal para el negocio ${idBusiness}.`);
      return null;
    }

    try {
      const schedule = JSON.parse(
        business.horarios as string,
      ) as WeeklyScheduleStructure;
      return schedule;
    } catch (error) {
      console.error(`Error al parsear el horario JSON para el negocio ${idBusiness}:`, error);
      return null;
    }
  }

  /**
   * Actualiza el horario para un día específico y lo sincroniza con el buscador.
   */
  async updateDailySchedule(
    idBusiness: string,
    day: DayOfWeek,
    timeRanges: string[],
  ): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      currentSchedule = {};
    }

    currentSchedule[day.toUpperCase()] = timeRanges;

    const scheduleJsonString = JSON.stringify(currentSchedule);
    await this.prisma.business.update({
      where: { id: idBusiness },
      data: { horarios: scheduleJsonString },
    });

    // 🔑 Sincronizar el buscador
    await this.searchableWeeklyScheduleCrudService.setWeeklySchedule(
      idBusiness,
      currentSchedule,
    );
  }

  /**
   * Añade un nuevo rango de tiempo a un día específico y lo sincroniza.
   */
  async addTimeRangeToDay(
    idBusiness: string,
    day: DayOfWeek,
    newTimeRange: string,
  ): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      currentSchedule = {};
    }

    const upperDay = day.toUpperCase();
    if (!currentSchedule[upperDay]) {
      currentSchedule[upperDay] = [];
    }

    if (!currentSchedule[upperDay].includes(newTimeRange)) {
      currentSchedule[upperDay].push(newTimeRange);
    }

    const scheduleJsonString = JSON.stringify(currentSchedule);
    await this.prisma.business.update({
      where: { id: idBusiness },
      data: { horarios: scheduleJsonString },
    });

    // 🔑 Sincronizar el buscador
    await this.searchableWeeklyScheduleCrudService.setWeeklySchedule(
      idBusiness,
      currentSchedule,
    );
  }

  /**
   * Elimina un rango de tiempo específico y lo sincroniza.
   */
  async removeTimeRangeFromDay(
    idBusiness: string,
    day: DayOfWeek,
    timeRangeToRemove: string,
  ): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      return;
    }

    const upperDay = day.toUpperCase();
    if (currentSchedule[upperDay]) {
      currentSchedule[upperDay] = currentSchedule[upperDay].filter(
        (range) => range !== timeRangeToRemove,
      );
      if (currentSchedule[upperDay].length === 0) {
        delete currentSchedule[upperDay];
      }
    } else {
      return;
    }

    const scheduleJsonString = JSON.stringify(currentSchedule);
    await this.prisma.business.update({
      where: { id: idBusiness },
      data: { horarios: scheduleJsonString },
    });

    // 🔑 Sincronizar el buscador
    await this.searchableWeeklyScheduleCrudService.setWeeklySchedule(
      idBusiness,
      currentSchedule,
    );
  }

  /**
   * Elimina el horario para un día específico y lo sincroniza.
   */
  async deleteDailySchedule(idBusiness: string, day: DayOfWeek): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);
    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      return;
    }

    delete currentSchedule[day.toUpperCase()];

    const scheduleJsonString = JSON.stringify(currentSchedule);
    await this.prisma.business.update({
      where: { id: idBusiness },
      data: { horarios: scheduleJsonString },
    });

    // 🔑 Sincronizar el buscador
    await this.searchableWeeklyScheduleCrudService.setWeeklySchedule(
      idBusiness,
      currentSchedule,
    );
  }
}