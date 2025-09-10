import { DayOfWeek } from '@prisma/client';
import { CreateWeeklyScheduleDto } from '../dtos/Request/create-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../dtos/Response/weekly-schedule-response.dto';
import { UpdateWeeklyScheduleDto } from '../dtos/Request/update-weekly-schedule.dto';

export interface IWeeklyScheduleService {
  create(
    createWeeklyScheduleDto: CreateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto>;
  findAll(
    businessId?: string,
    dayOfWeek?: DayOfWeek,
  ): Promise<WeeklyScheduleResponseDto[]>;
  findAllW(
  ): Promise<WeeklyScheduleResponseDto[]>;
  findOne(id: string): Promise<WeeklyScheduleResponseDto>;
  findByBusinessId(businessId: string): Promise<Record<string, string[]>>;
  findPanleBusinessByBusinessId(businessId: string): Promise<any>;
  update(
    id: string,
    updateWeeklyScheduleDto: UpdateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResponseDto>;
  remove(id: string): Promise<void>;
}
