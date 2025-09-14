import { IsString, IsNotEmpty, IsEnum, IsUUID, Matches } from 'class-validator';
import { DayOfWeek } from '@prisma/client'; // Importa el Enum DayOfWeek de Prisma Client

export class CreateWeeklyScheduleDto {
  @IsString()
  @IsUUID()
  businessId: string; // El ID del negocio al que pertenece este horario

  @IsNotEmpty()
  @IsEnum(DayOfWeek, { message: 'dayOfWeek must be a valid DayOfWeek enum value (MONDAY, TUESDAY, etc.).' })
  dayOfWeek: DayOfWeek; // Día de la semana (ej. MONDAY)

  @IsString()
  @IsNotEmpty()
  // Patrón para HH:MM (formato de 24 horas, ej. "09:00", "17:30")
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'openingTime must be in HH:MM format.' })
  openingTime: string; // Hora de apertura (ej. "09:00")

  @IsString()
  @IsNotEmpty()
  // Patrón para HH:MM (formato de 24 horas, ej. "09:00", "17:30")
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'closingTime must be in HH:MM format.' })
  closingTime: string; // Hora de cierre (ej. "17:00")
}