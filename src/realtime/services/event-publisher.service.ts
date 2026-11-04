import { Injectable, Logger } from '@nestjs/common';

import { randomUUID } from 'crypto';

import {
  RealtimeEvent,
  RealtimeEventType,
} from '../contracts/realtime-event.contract';

import { RealtimeRoom } from '../rooms/realtime-room.types';

import { RealtimeTransport } from '../ports/realtime-transport.port';

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly transport: RealtimeTransport) {}

  emitToRoom<T>(
    room: RealtimeRoom,
    eventType: RealtimeEventType,
    payload: T,
  ): RealtimeEvent<T> | null {
    const event: RealtimeEvent<T> = {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      payload,
    };

    const published = this.transport.emitToRoom(room, eventType, event);

    if (!published) {
      this.logger.error(`No se pudo publicar ${eventType} en ${room}`);

      return null;
    }

    this.logger.debug(`Evento publicado: ${eventType} → ${room}`);

    return event;
  }
}
