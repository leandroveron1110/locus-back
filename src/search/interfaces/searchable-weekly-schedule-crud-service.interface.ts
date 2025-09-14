import { WeeklyScheduleStructure } from '../types/WeeklySchedule';

export interface ISearchableWeeklyScheduleCrudService {
  setWeeklySchedule(
    idBusiness: string,
    schedule: WeeklyScheduleStructure,
  ): Promise<void>;
  getWeeklySchedule(
    idBusiness: string,
  ): Promise<WeeklyScheduleStructure | null>;
  updateDailySchedule(
    idBusiness: string,
    day: string,
    timeRanges: string[],
  ): Promise<void>;
  addTimeRangeToDay(
    idBusiness: string,
    day: string,
    newTimeRange: string,
  ): Promise<void>;
  removeTimeRangeFromDay(
    idBusiness: string,
    day: string,
    timeRangeToRemove: string,
  ): Promise<void>;
  deleteDailySchedule(idBusiness: string, day: string): Promise<void>;
}
