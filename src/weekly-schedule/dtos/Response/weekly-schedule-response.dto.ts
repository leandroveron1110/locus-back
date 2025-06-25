import { WeeklySchedule as PrismaWeeklySchedule, DayOfWeek } from '@prisma/client'; // Importa el tipo de Prisma

export class WeeklyScheduleResponseDto {
  id: string;
  businessId: string;
  dayOfWeek: DayOfWeek;
  openingTime: string; // Devuelve como string en HH:MM
  closingTime: string; // Devuelve como string en HH:MM
  createdAt: Date;
  updatedAt: Date;

  static fromPrisma(schedule: PrismaWeeklySchedule): WeeklyScheduleResponseDto {
    const dto = new WeeklyScheduleResponseDto();
    dto.id = schedule.id;
    dto.businessId = schedule.businessId;
    dto.dayOfWeek = schedule.dayOfWeek;

    // Formatear las horas a HH:MM. Prisma devuelve Date para @db.Time(0)
    // Extraer solo la parte de la hora y minuto.
    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    dto.openingTime = formatTime(schedule.openingTime);
    dto.closingTime = formatTime(schedule.closingTime);
    dto.createdAt = schedule.createdAt;
    dto.updatedAt = schedule.updatedAt;
    return dto;
  }
}