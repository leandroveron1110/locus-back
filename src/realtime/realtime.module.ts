import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EventGateway } from './gateways/event.gateway';

import { EventPublisherService } from './services/event-publisher.service';
import { RoomAuthorizationService } from './services/room-authorization.service';
import { SocketIoRealtimeTransport } from './services/socket-io-realtime-transport.service';

import { RealtimeTransport } from './ports/realtime-transport.port';
import { BusinessGateway } from './gateways/business.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error('JWT_SECRET no está configurado');
        }

        return {
          secret,
        };
      },
    }),
  ],

  providers: [
    EventGateway,
    BusinessGateway,
    RoomAuthorizationService,
    SocketIoRealtimeTransport,
    {
      provide: RealtimeTransport,
      useClass: SocketIoRealtimeTransport,
    },
    EventPublisherService,
  ],

  exports: [EventPublisherService],
})
export class RealtimeModule {}
