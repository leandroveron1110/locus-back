import { Test, TestingModule } from '@nestjs/testing';
import { SpecialScheduleService } from './special-schedule.service';

describe('SpecialScheduleService', () => {
  let service: SpecialScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecialScheduleService],
    }).compile();

    service = module.get<SpecialScheduleService>(SpecialScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
