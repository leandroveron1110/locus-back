import { Test, TestingModule } from '@nestjs/testing';
import { SpecialScheduleController } from './special-schedule.controller';

describe('SpecialScheduleController', () => {
  let controller: SpecialScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialScheduleController],
    }).compile();

    controller = module.get<SpecialScheduleController>(SpecialScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
