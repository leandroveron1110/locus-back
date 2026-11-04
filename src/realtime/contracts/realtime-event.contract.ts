export const REALTIME_EVENTS = {
  DELIVERY_COMMAND_CREATED: 'delivery.command.created',
  DELIVERY_COMMAND_UPDATED: 'delivery.command.updated',
} as const;

export type RealtimeEventType =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  eventType: RealtimeEventType;
  occurredAt: string;
  payload: T;
}
