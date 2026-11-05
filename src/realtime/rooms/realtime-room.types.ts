export const REALTIME_ROOMS = {
  DELIVERY_OPERATIONS: 'delivery:operations',
} as const;

export const BUSINESS_REALTIME_ROOMS = {
  operations: (businessId: string) => `business:${businessId}:operations`,
} as const;

// 1. Unimos el tipo fijo con cualquier string que devuelva la función de negocio (o un patrón genérico)
export type DeliveryRoom = (typeof REALTIME_ROOMS)[keyof typeof REALTIME_ROOMS];
export type BusinessRoom = `business:${string}:operations`;

// 2. El tipo general ahora engloba a ambos
export type RealtimeRoom = DeliveryRoom | BusinessRoom;

export const REALTIME_PERMISSIONS = {
  DELIVERY_OPERATIONS_READ: 'delivery:operations:read',
} as const;

export interface RealtimeIdentity {
  userId: string;
}