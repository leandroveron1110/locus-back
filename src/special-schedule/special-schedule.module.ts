import { Module } from '@nestjs/common';
import { SpecialScheduleController } from './special-schedule.controller';
import { SpecialScheduleService } from './special-schedule.service';

@Module({
  controllers: [SpecialScheduleController],
  providers: [SpecialScheduleService]
})
export class SpecialScheduleModule {}
