import { Module } from '@nestjs/common';
import { PushController } from './controller/push.controller';
import { PushService } from './services/push.service';
import { LoggingModule } from 'src/logging/logging.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  controllers: [PushController],
  providers: [PushService],
  imports: [LoggingModule, EventEmitterModule.forRoot()],
})
export class PushModule {}
