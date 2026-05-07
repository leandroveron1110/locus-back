import {
  DeliveryStatus,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
} from '@prisma/client';
import { Socket, Server } from 'socket.io';
import {
  IOrderDtoResponse,
  OrderResponseDto,
} from 'src/order/dtos/response/order-response.dto';

export interface IOrderGateway {
  server: Server;

  afterInit(server: Server): void;

  handleConnection(client: Socket): void;

  handleDisconnect(client: Socket): void;

  handleJoinRole(
    data: { role: 'user' | 'business' | 'delivery'; id?: string },
    client: Socket,
  ): void;

  handleJoinOrder(data: { orderId: string }, client: Socket): void;

  emitOrderAssignedToDelivery(order: OrderResponseDto): void;

  emitNewOrder(
    order: IOrderDtoResponse & {
      orderPaymentMethod: PaymentMethodType;
      paymentStatus: PaymentStatus;
      businessId: string;
    },
  ): void;

  emitNewOrderNotification(order: OrderResponseDto): void;

  emitUserNotification(order: {
    id: string;
    userId: string;
    status: OrderStatus;
    deliveryStatus: DeliveryStatus; // Nuevo
    paymentStatus: PaymentStatus; // Nuevo
  }): void;

  emitOrderStatusUpdated(
    orderId: string,
    status: string,
    userId: string,
    businessId: string,
    deliveryCompanyId?: string | null,
  ): void;
  emitPaymentUpdated(
    orderId: string,
    paymentStatus: string,
    paymentReceiptUrl: string,
    userId: string,
    businessId: string,
  ): void;
}
