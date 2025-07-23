import { PrismaService } from 'src/prisma/prisma.service';
import { ISearchableBusinessCrudService } from '../interfaces/serach-crud-service.interface';
import { Inject } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { WeeklyScheduleStructure } from '../types/WeeklySchedule';

export class WeeklyScheduleSearchCrudService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchBusines: ISearchableBusinessCrudService,
  ) {}

  /**
   * Establece (reemplaza completamente) el horario semanal para un negocio.
   * El objeto de horario se convierte a una cadena JSON antes de guardarse.
   * @param idBusiness El ID del negocio.
   * @param schedule El objeto de horario semanal a establecer.
   */
  async setWeeklySchedule(idBusiness: string, schedule: WeeklyScheduleStructure): Promise<void> {
    // Asegura que el negocio existe antes de proceder
    await this.searchBusines.checkOne(idBusiness);

    try {
      // Convierte el objeto de horario a una cadena JSON
      const scheduleJsonString = JSON.stringify(schedule);

      // Actualiza el campo 'horarios' en la base de datos
      await this.prisma.searchableBusiness.update({
        where: { id: idBusiness },
        data: {
          horarios: scheduleJsonString,
        },
      });
      console.log(`Horario semanal establecido para el negocio ${idBusiness}.`);
    } catch (error) {
      console.error(`Error al establecer el horario semanal para el negocio ${idBusiness}:`, error);
      throw new Error(`No se pudo establecer el horario semanal.`);
    }
  }

  /**
   * Obtiene el horario semanal para un negocio y lo parsea de una cadena JSON a un objeto.
   * @param idBusiness El ID del negocio.
   * @returns Una promesa que resuelve con el objeto de horario semanal o null si no se encuentra o hay un error de parseo.
   */
  async getWeeklySchedule(idBusiness: string): Promise<WeeklyScheduleStructure | null> {
    // Busca el negocio y selecciona solo el campo 'horarios'
    const business = await this.prisma.searchableBusiness.findUnique({
      where: { id: idBusiness },
      select: { horarios: true },
    });

    if (!business || !business.horarios) {
      console.log(`No se encontró horario semanal para el negocio ${idBusiness}.`);
      return null;
    }

    try {
      // Parsea la cadena JSON de horarios a un objeto
      const schedule = JSON.parse(business.horarios as string) as WeeklyScheduleStructure;
      return schedule;
    } catch (error) {
      console.error(`Error al parsear el horario JSON para el negocio ${idBusiness}:`, error);
      // Podrías lanzar un error o devolver null/un objeto vacío según tu política de errores
      return null;
    }
  }

  /**
   * Actualiza el horario para un día específico dentro del horario semanal de un negocio,
   * reemplazando cualquier horario existente para ese día con el nuevo array de rangos de tiempo.
   * Requiere leer el horario actual, modificarlo y luego guardarlo de nuevo.
   * @param idBusiness El ID del negocio.
   * @param day El día de la semana (ej. "MONDAY", "TUESDAY").
   * @param timeRanges Un array de rangos de tiempo para ese día (ej. ["09:00-13:00", "15:00-19:00"]).
   */
  async updateDailySchedule(idBusiness: string, day: string, timeRanges: string[]): Promise<void> {
    // Asegura que el negocio existe antes de proceder
    await this.searchBusines.checkOne(idBusiness);

    // Obtiene el horario actual del negocio
    let currentSchedule = await this.getWeeklySchedule(idBusiness);

    // Si no hay un horario actual, inicializa uno vacío
    if (!currentSchedule) {
      currentSchedule = {};
    }

    // Actualiza el array de rangos de tiempo para el día específico
    currentSchedule[day.toUpperCase()] = timeRanges; // Asegura que el día esté en mayúsculas para consistencia

    // Guarda el horario modificado (reemplazando el anterior)
    await this.setWeeklySchedule(idBusiness, currentSchedule);
    console.log(`Horario para ${day} actualizado a [${timeRanges.join(', ')}] para el negocio ${idBusiness}.`);
  }

  /**
   * Añade un nuevo rango de tiempo a un día específico del horario semanal de un negocio.
   * Si el día no tiene horarios, se crea un nuevo array. Si ya tiene, se añade el nuevo rango.
   * @param idBusiness El ID del negocio.
   * @param day El día de la semana (ej. "MONDAY").
   * @param newTimeRange El nuevo rango de tiempo a añadir (ej. "20:00-23:00").
   */
  async addTimeRangeToDay(idBusiness: string, day: string, newTimeRange: string): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);

    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      currentSchedule = {};
    }

    const upperDay = day.toUpperCase();
    if (!currentSchedule[upperDay]) {
      currentSchedule[upperDay] = [];
    }

    // Añade el nuevo rango solo si no existe ya para evitar duplicados
    if (!currentSchedule[upperDay].includes(newTimeRange)) {
      currentSchedule[upperDay].push(newTimeRange);
    }

    await this.setWeeklySchedule(idBusiness, currentSchedule);
    console.log(`Rango de tiempo "${newTimeRange}" añadido al día ${day} para el negocio ${idBusiness}.`);
  }

  /**
   * Elimina un rango de tiempo específico de un día del horario semanal de un negocio.
   * @param idBusiness El ID del negocio.
   * @param day El día de la semana (ej. "MONDAY").
   * @param timeRangeToRemove El rango de tiempo a eliminar (ej. "09:00-13:00").
   */
  async removeTimeRangeFromDay(idBusiness: string, day: string, timeRangeToRemove: string): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);

    let currentSchedule = await this.getWeeklySchedule(idBusiness);
    if (!currentSchedule) {
      console.log(`No hay horario para el negocio ${idBusiness} o el día ${day}.`);
      return;
    }

    const upperDay = day.toUpperCase();
    if (currentSchedule[upperDay]) {
      // Filtra el array para eliminar el rango de tiempo específico
      currentSchedule[upperDay] = currentSchedule[upperDay].filter(range => range !== timeRangeToRemove);
      // Si el array queda vacío después de eliminar, podrías considerar eliminar la propiedad del día
      if (currentSchedule[upperDay].length === 0) {
        delete currentSchedule[upperDay];
      }
    } else {
      console.log(`No se encontró el día ${day} en el horario del negocio ${idBusiness}.`);
      return;
    }

    await this.setWeeklySchedule(idBusiness, currentSchedule);
    console.log(`Rango de tiempo "${timeRangeToRemove}" eliminado del día ${day} para el negocio ${idBusiness}.`);
  }

  /**
   * Elimina el horario para un día específico del horario semanal de un negocio.
   * Requiere leer el horario actual, modificarlo y luego guardarlo de nuevo.
   * @param idBusiness El ID del negocio.
   * @param day El día de la semana a eliminar (ej. "MONDAY").
   */
  async deleteDailySchedule(idBusiness: string, day: string): Promise<void> {
    await this.searchBusines.checkOne(idBusiness);

    let currentSchedule = await this.getWeeklySchedule(idBusiness);

    if (!currentSchedule) {
      console.log(`No hay horario para eliminar para el negocio ${idBusiness}.`);
      return;
    }

    // Elimina la propiedad del día específico
    delete currentSchedule[day.toUpperCase()];

    await this.setWeeklySchedule(idBusiness, currentSchedule);
    console.log(`Horario para ${day} eliminado del negocio ${idBusiness}.`);
  }
}
