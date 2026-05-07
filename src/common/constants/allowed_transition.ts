import { OrderStatus, PaymentStatus, DeliveryStatus } from '@prisma/client';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.IN_PROGRESS,
    PaymentStatus.CONFIRMED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.IN_PROGRESS]: [
    PaymentStatus.CONFIRMED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.CONFIRMED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.REJECTED]: [PaymentStatus.IN_PROGRESS, PaymentStatus.PENDING],
  [PaymentStatus.REFUNDED]: [],
};

export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.NOT_APPLICABLE]: [],
  [DeliveryStatus.PENDING]: [
    DeliveryStatus.REQUESTED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.REQUESTED]: [
    DeliveryStatus.SHIPPED,
    DeliveryStatus.CANCELLED,
    DeliveryStatus.PENDING,
  ],
  [DeliveryStatus.SHIPPED]: [
    DeliveryStatus.COMPLETED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.CANCELLED]: [DeliveryStatus.PENDING], // Posibilidad de re-solicitar
  [DeliveryStatus.COMPLETED]: [],
};

export const canChangeOrderStatus = (
  current: OrderStatus,
  next: OrderStatus,
): boolean => {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false;
};

export const canChangeDeliveryStatus = (
  next: DeliveryStatus,
  currentOrder: { status: OrderStatus; deliveryStatus: DeliveryStatus },
): boolean => {
  // Validación de hilos cruzados:
  // No podés pedir cadete (REQUESTED) si la orden no está confirmada o preparándose
  if (next === DeliveryStatus.REQUESTED) {
    const validOrderStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ];
    if (!validOrderStatuses.includes(currentOrder.status)) return false;
  }

  // No podés despachar (SHIPPED) si la orden no está lista (READY)
  if (
    next === DeliveryStatus.SHIPPED &&
    currentOrder.status !== OrderStatus.READY
  ) {
    return false;
  }

  return (
    DELIVERY_TRANSITIONS[currentOrder.deliveryStatus]?.includes(next) ?? false
  );
};