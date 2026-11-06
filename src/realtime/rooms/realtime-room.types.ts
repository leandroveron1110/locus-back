export const REALTIME_ROOMS = {
  DELIVERY_OPERATIONS: 'delivery:operations',
} as const;

export type DeliveryRoom = (typeof REALTIME_ROOMS)[keyof typeof REALTIME_ROOMS];

export type BusinessRoom = `business:${string}:operations`;

export const BUSINESS_REALTIME_ROOMS = {
  operations: (businessId: string): BusinessRoom =>
    `business:${businessId}:operations`,
} as const;

export type RealtimeRoom = DeliveryRoom | BusinessRoom;

export const REALTIME_PERMISSIONS = {
  DELIVERY_OPERATIONS_READ: 'delivery:operations:read',
} as const;

export interface RealtimeIdentity {
  userId: string;
}
