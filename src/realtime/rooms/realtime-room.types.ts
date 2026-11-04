export const REALTIME_ROOMS = {
  DELIVERY_OPERATIONS: 'delivery:operations',
} as const;

export type RealtimeRoom = (typeof REALTIME_ROOMS)[keyof typeof REALTIME_ROOMS];

export const REALTIME_PERMISSIONS = {
  DELIVERY_OPERATIONS_READ: 'delivery:operations:read',
} as const;

export interface RealtimeIdentity {
  userId: string;
  // permissions: string[];
}
