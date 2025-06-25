import { Test, TestingModule } from '@nestjs/testing';
import { MenuSectionService } from './menu-section.service';

describe('MenuSectionService', () => {
  let service: MenuSectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuSectionService],
    }).compile();

    service = module.get<MenuSectionService>(MenuSectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
