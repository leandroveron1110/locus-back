// Define el tipo para la estructura del horario semanal
// Ahora cada día puede tener un array de rangos de tiempo.
// Por ejemplo: { "MONDAY": ["09:00-13:00", "15:00-19:00"], "TUESDAY": ["00:00-23:59"], ... }
export type WeeklyScheduleStructure = Record<DayOfWeek, string[]>;