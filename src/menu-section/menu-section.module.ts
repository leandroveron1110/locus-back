import { Module } from '@nestjs/common';
import { MenuSectionController } from './menu-section.controller';
import { MenuSectionService } from './menu-section.service';

@Module({
  controllers: [MenuSectionController],
  providers: [MenuSectionService]
})
export class MenuSectionModule {}
