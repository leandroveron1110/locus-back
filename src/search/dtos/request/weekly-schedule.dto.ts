// src/dtos/request/weekly-schedule.dto.ts
import { IsObject, IsString, IsArray, IsNotEmpty } from 'class-validator';
import { WeeklyScheduleStructure } from 'src/search/types/WeeklySchedule';

// DTO para establecer (reemplazar) el horario semanal completo
export class SetWeeklyScheduleDto {
  @IsObject()
  @IsNotEmpty()
  // Aquí no usamos @ValidateNested porque WeeklySchedule es un Record<string, string[]>,
  // y class-validator no valida directamente objetos con claves dinámicas y valores de array anidados de esta manera.
  // La validación de la estructura interna (ej. que los strings sean "HH:MM-HH:MM")
  // se haría mejor en el servicio o con un custom validator si es crítico.
  schedule: WeeklyScheduleStructure;
}

// DTO para actualizar los rangos de tiempo de un día específico
export class UpdateDailyScheduleDto {
  @IsArray()
  @IsString({ each: true }) // Asegura que cada elemento del array sea un string
  @IsNotEmpty({ each: true }) // Asegura que cada string no esté vacío
  timeRanges: string[];
}

// DTO para añadir un nuevo rango de tiempo a un día
export class AddTimeRangeToDayDto {
  @IsString()
  @IsNotEmpty()
  newTimeRange: string;
}

// DTO para eliminar un rango de tiempo específico de un día
export class RemoveTimeRangeFromDayDto {
  @IsString()
  @IsNotEmpty()
  timeRangeToRemove: string;
}
