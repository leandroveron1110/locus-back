import { Injectable, Logger } from '@nestjs/common';

import { EventGateway } from '../gateways/event.gateway';

import { RealtimeTransport } from '../ports/realtime-transport.port';

import {
  RealtimeEvent,
  RealtimeEventType,
} from '../contracts/realtime-event.contract';

import { RealtimeRoom } from '../rooms/realtime-room.types';

@Injectable()
export class SocketIoRealtimeTransport extends RealtimeTransport {
  private readonly logger = new Logger(SocketIoRealtimeTransport.name);

  constructor(private readonly eventGateway: EventGateway) {
    super();
  }

  emitToRoom<T>(
    room: RealtimeRoom,
    eventType: RealtimeEventType,
    event: RealtimeEvent<T>,
  ): boolean {
    const namespace = this.eventGateway.getNamespace();

    if (!namespace) {
      this.logger.error('No se pudo publicar: namespace no disponible');

      return false;
    }

    namespace.to(room).emit(eventType, event);

    return true;
  }
}
