import {
  RealtimeEvent,
  RealtimeEventType,
} from '../contracts/realtime-event.contract';

import { RealtimeRoom } from '../rooms/realtime-room.types';

export abstract class RealtimeTransport {
  abstract emitToRoom<T>(
    room: RealtimeRoom,
    eventType: RealtimeEventType,
    event: RealtimeEvent<T>,
  ): boolean;
}
