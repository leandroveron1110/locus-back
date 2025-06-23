import { Module } from '@nestjs/common';
import { TagController } from './controllers/targs.controller';
import { TagService } from './services/targs.service';

@Module({
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService]
})
export class TargsModule {}
