import { Module } from '@nestjs/common';
import { NotificationController } from './controller/notification.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationCommandService } from './service/notification.command.service';
import { NotificationQueryService } from './service/notification.query.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationCommandService, NotificationQueryService],
  imports: [EventEmitterModule.forRoot()],
  exports: [NotificationCommandService]
})
export class NotificationModule {}
