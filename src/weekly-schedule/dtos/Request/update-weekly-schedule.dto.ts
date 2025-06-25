import { PartialType } from '@nestjs/mapped-types';
import { CreateWeeklyScheduleDto } from './create-weekly-schedule.dto';

export class UpdateWeeklyScheduleDto extends PartialType(CreateWeeklyScheduleDto) {}