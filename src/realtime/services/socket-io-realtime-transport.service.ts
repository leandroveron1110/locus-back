import { Injectable, Logger } from '@nestjs/common';

import { EventGateway } from '../gateways/event.gateway';

import { RealtimeTransport } from '../ports/realtime-transport.port';

import {
  RealtimeEvent,
  RealtimeEventType,
} from '../contracts/realtime-event.contract';

import { RealtimeRoom } from '../rooms/realtime-room.types';
import { BusinessGateway } from '../gateways/business.gateway';

@Injectable()
export class SocketIoRealtimeTransport extends RealtimeTransport {
  private readonly logger = new Logger(SocketIoRealtimeTransport.name);

  constructor(
    private readonly eventGateway: EventGateway,
    private readonly businessGateway: BusinessGateway,
  ) {
    super();
  }

  emitToRoom<T>(
    room: RealtimeRoom,
    eventType: RealtimeEventType,
    event: RealtimeEvent<T>,
  ): boolean {
    const namespace = room.startsWith('business:')
      ? this.businessGateway.getNamespace()
      : this.eventGateway.getNamespace();

    if (!namespace) {
      this.logger.error(
        `Namespace no disponible para la sala ${room}`,
      );

      return false;
    }

    namespace.to(room).emit(eventType, event);

    this.logger.debug(
      `Evento ${eventType} publicado en ${namespace.name} → ${room}`,
    );

    return true;
  }
}
