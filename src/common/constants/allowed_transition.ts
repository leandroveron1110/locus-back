import { OrderStatus } from "@prisma/client";

export type Actor = 'CUSTOMER' | 'BUSINESS' | 'DELIVERY';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // 1. Creación y pago
  [OrderStatus.PENDING]: [OrderStatus.WAITING_FOR_PAYMENT, OrderStatus.CANCELLED_BY_USER, OrderStatus.FAILED],
  [OrderStatus.WAITING_FOR_PAYMENT]: [OrderStatus.PAYMENT_IN_PROGRESS, OrderStatus.CANCELLED_BY_USER, OrderStatus.FAILED],
  [OrderStatus.PAYMENT_IN_PROGRESS]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.FAILED],
  [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.PENDING_CONFIRMATION],

  // 2. Confirmación y preparación
  [OrderStatus.PENDING_CONFIRMATION]: [OrderStatus.CONFIRMED, OrderStatus.REJECTED_BY_BUSINESS, OrderStatus.CANCELLED_BY_USER],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED_BY_BUSINESS],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_DELIVERY_PICKUP, OrderStatus.READY_FOR_CUSTOMER_PICKUP, OrderStatus.CANCELLED_BY_BUSINESS],
  [OrderStatus.REJECTED_BY_BUSINESS]: [],

  // 2.1 Pedido listo
  [OrderStatus.READY_FOR_CUSTOMER_PICKUP]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED_BY_BUSINESS],
  [OrderStatus.READY_FOR_DELIVERY_PICKUP]: [OrderStatus.DELIVERY_PENDING, OrderStatus.CANCELLED_BY_BUSINESS],

  // 3. Asignación de delivery
  [OrderStatus.DELIVERY_PENDING]: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.CANCELLED_BY_BUSINESS],
  [OrderStatus.DELIVERY_ASSIGNED]: [OrderStatus.DELIVERY_ACCEPTED, OrderStatus.DELIVERY_REJECTED, OrderStatus.CANCELLED_BY_DELIVERY],
  [OrderStatus.DELIVERY_ACCEPTED]: [OrderStatus.OUT_FOR_PICKUP, OrderStatus.DELIVERY_REJECTED],
  [OrderStatus.DELIVERY_REJECTED]: [OrderStatus.DELIVERY_REASSIGNING, OrderStatus.CANCELLED_BY_DELIVERY],
  [OrderStatus.DELIVERY_REASSIGNING]: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.CANCELLED_BY_BUSINESS],

  // 4. Transporte
  [OrderStatus.OUT_FOR_PICKUP]: [OrderStatus.PICKED_UP, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],

  // 5. Entrega y finalización
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.DELIVERY_FAILED]: [OrderStatus.RETURNED, OrderStatus.DELIVERY_PENDING],
  [OrderStatus.RETURNED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],

  // 6. Cancelaciones
  [OrderStatus.CANCELLED_BY_USER]: [],
  [OrderStatus.CANCELLED_BY_BUSINESS]: [],
  [OrderStatus.CANCELLED_BY_DELIVERY]: [],

  // 7. Errores generales
  [OrderStatus.FAILED]: [OrderStatus.PENDING] // Posibilidad de reintento
};


export const ACTOR_VISIBILITY: Record<Actor, OrderStatus[]> = {
  CUSTOMER: [
    OrderStatus.PENDING, OrderStatus.WAITING_FOR_PAYMENT, OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_CUSTOMER_PICKUP,
    OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED
  ],
  BUSINESS: [
    OrderStatus.PENDING_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.PREPARING,
    OrderStatus.READY_FOR_DELIVERY_PICKUP, OrderStatus.READY_FOR_CUSTOMER_PICKUP,
    OrderStatus.PICKED_UP, OrderStatus.DELIVERED, OrderStatus.COMPLETED,
    OrderStatus.CANCELLED_BY_USER, OrderStatus.REJECTED_BY_BUSINESS
  ],
  DELIVERY: [
    OrderStatus.READY_FOR_DELIVERY_PICKUP, OrderStatus.DELIVERY_PENDING,
    OrderStatus.DELIVERY_ASSIGNED, OrderStatus.DELIVERY_ACCEPTED, 
    OrderStatus.OUT_FOR_PICKUP, OrderStatus.PICKED_UP, 
    OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED
  ]
};

export const canTransition = (current: OrderStatus, next: OrderStatus): boolean => {
  // 1. Convertimos a string para usar startsWith
  const nextStr = next.toString();

  // 2. Permitir cancelación/rechazo si no está finalizado
  if (nextStr.startsWith('CANCELLED_') || next === OrderStatus.REJECTED_BY_BUSINESS) {
    // Usamos el casting "as OrderStatus[]" para evitar el error de tipos
    const finalStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.COMPLETED];
    return !finalStatuses.includes(current);
  }

  // 3. Verificación normal
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
};

export const canViewStatus = (actor: Actor, status: OrderStatus): boolean => {
  return ACTOR_VISIBILITY[actor].includes(status);
};