
// Si no tenés el enum exportado globalmente desde Prisma, podés usar los literales exactos
export enum StateType {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  DELIVERY = 'DELIVERY',
  SYNC = 'SYNC', // Agregalo si tu enum de Prisma lo soporta, sino usa los 3 que tenés mapeados
}

export interface OrderEventDto {
  orderId: string;

  stateType: StateType;

  value: string;

  author?: string;

  createdAt: string;
}

export interface SyncOrderEventsDto {
  events: OrderEventDto[];
}
