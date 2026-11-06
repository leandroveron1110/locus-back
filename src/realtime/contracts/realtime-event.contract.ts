export const DELIVERY_EVENTS = {
  DELIVERY_COMMAND_CREATED: "delivery.command.created",
  DELIVERY_COMMAND_UPDATED: "delivery.command.updated",
  DELIVERY_COMMAND_ASSIGNED: "delivery.command.assigned",
} as const;

export const BUSINESS_EVENTS = {
  BUSINESS_UPDATED: "business.updated",
  BUSINESS_CREATE_COMMAND: "business.create.command",
  BUSINESS_CANCEL_COMMAND: "business.cancel.command",
  BUSINESS_FINISHED_COMMAND: "business.finished.command",
  BUSINESS_QUOTE_COMMAND: "business.quote.command",
  BUSINESS_ACCEPT_COMMAND: "business.accept.command",
  BUSINESS_ASSIGN_COMMAND: "business.assign.command",
  BUSINESS_IN_TRANSIT_COMMAND: "business.in.transit.command",
  BUSINESS_COMPLETE_COMMAND: "business.complete.command",
} as const;

export type BusinessEventType =
  (typeof BUSINESS_EVENTS)[keyof typeof BUSINESS_EVENTS];

export type DeliveryEventType =
  (typeof DELIVERY_EVENTS)[keyof typeof DELIVERY_EVENTS];

export type RealtimeEventType = DeliveryEventType | BusinessEventType

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  eventType: RealtimeEventType;
  occurredAt: string;
  payload: T;
}
