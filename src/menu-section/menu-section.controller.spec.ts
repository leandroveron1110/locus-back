import { Test, TestingModule } from '@nestjs/testing';
import { MenuSectionController } from './menu-section.controller';

describe('MenuSectionController', () => {
  let controller: MenuSectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuSectionController],
    }).compile();

    controller = module.get<MenuSectionController>(MenuSectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
