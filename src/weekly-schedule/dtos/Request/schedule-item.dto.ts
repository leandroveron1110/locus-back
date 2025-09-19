// src/modules/weekly-schedule/dtos/Request/schedule-item.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsUUID, Matches, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { DayOfWeek } from '@prisma/client';
import { Type } from 'class-transformer';

export class ScheduleItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsEnum(DayOfWeek, { message: 'dayOfWeek must be a valid DayOfWeek enum value (MONDAY, TUESDAY, etc.).' })
  dayOfWeek: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'openingTime must be in HH:MM format.' })
  openingTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'closingTime must be in HH:MM format.' })
  closingTime: string;
}


export class CreateOrUpdateWeeklyScheduleDto {
  @IsUUID()
  businessId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules: ScheduleItemDto[];
}