import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderStatus, PaymentMethodType, PaymentStatus } from '@prisma/client';
import { OrderResponseDto } from 'src/order/dtos/response/order-response.dto';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { LoggingService } from 'src/logging/logging.service';

@WebSocketGateway({
  cors: {
    origin: '*', // o tu dominio si quieres restringir
  },
  transports: ['websocket'],
})
export class OrderGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    IOrderGateway
{
  server: Server;

  constructor(private readonly logger: LoggingService) {
    this.logger.setContext(OrderGateway.name);
    this.logger.setService('OrderModule');
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ----------------------------------------------------------------
  // 🎯 Gestión de roles
  // ----------------------------------------------------------------

  /**
   * Un cliente, negocio o delivery se une según su rol.
   * Ejemplo:
   * socket.emit('join_role', { role: 'user', id: '123' })
   */
  @SubscribeMessage('join_role')
  handleJoinRole(
    @MessageBody()
    data: { role: 'user' | 'business' | 'delivery'; id?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { role, id } = data;

    if (!role || !id) {
      this.logger.warn('Invalid role or missing id', {
        clientId: client.id,
        data,
      });
      return;
    }

    const roomName = `${role}-${id}`;
    client.join(roomName);

    this.logger.log(`Client joined role room`, {
      clientId: client.id,
      role,
      room: roomName,
    });
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.orderId) {
      this.logger.warn('Invalid order join attempt', { clientId: client.id });
      return;
    }

    const room = `order-${data.orderId}`;
    client.join(room);

    this.logger.log('Client joined order room', {
      clientId: client.id,
      room,
      orderId: data.orderId,
    });
  }

  /** Cuando una orden se asigna a una empresa de delivery */
  emitOrderAssignedToDelivery(order: OrderResponseDto) {
    if (!order.deliveryCompanyId) return;

    const room = `delivery-${order.deliveryCompanyId}`;
    this.server.to(room).emit('newOrderAssigned', order);

    this.logger.log('New order assigned to delivery company', {
      deliveryCompanyId: order.deliveryCompanyId,
      orderId: order.id,
    });
  }

  /** Cuando se crea una nueva orden */
  emitNewOrder(order: OrderResponseDto) {
    const businessRoom = `business-${order.businessId}`;
    const userRoom = `user-${order.userId}`;

    const shouldNotifyBusiness =
      order.paymentType === PaymentMethodType.CASH ||
      (order.paymentType === PaymentMethodType.TRANSFER &&
        order.paymentStatus !== PaymentStatus.PENDING);

    if (shouldNotifyBusiness) {
      this.server.to(businessRoom).emit('new_order', order);
      this.logger.log('New order sent to business', {
        businessId: order.businessId,
        orderId: order.id,
      });
    }

    if (!shouldNotifyBusiness) {
      this.server.to(userRoom).emit('order_created', order);
      this.logger.log('New order created for user', {
        userId: order.userId,
        orderId: order.id,
      });
    }
  }

  emitNewOrderNotification(order: OrderResponseDto) {
    const businessRoom = `business-${order.businessId}`;

    const shouldNotifyBusiness =
      order.paymentType === PaymentMethodType.CASH ||
      (order.paymentType === PaymentMethodType.TRANSFER &&
        order.paymentStatus !== PaymentStatus.PENDING);

    if (shouldNotifyBusiness) {
      this.server.to(businessRoom).emit('new_order_notification', {
        orderId: order.id,
        customerName: order.user?.fullName ?? 'Cliente',
        total: order.total,
        createdAt: order.createdAt,
      });

      this.logger.log('New order notification sent to business', {
        businessId: order.businessId,
        orderId: order.id,
      });
    }
  }

  /** Cuando se actualiza el estado de una orden */
  emitOrderStatusUpdated(
    orderId: string,
    status: OrderStatus,
    userId: string,
    businessId: string,
    deliveryCompanyId?: string,
  ) {
    const payload = { orderId, status };

    this.server.to(`user-${userId}`).emit('order_status_updated', payload);
    this.server
      .to(`business-${businessId}`)
      .emit('order_status_updated', payload);

    if (deliveryCompanyId) {
      this.server
        .to(`delivery-${deliveryCompanyId}`)
        .emit('order_ready_for_delivery', payload);
    }

    this.logger.log('Order status updated', {
      orderId,
      status,
      userId,
      businessId,
      deliveryCompanyId,
    });
  }

  /** Cuando se actualiza el pago */
  emitPaymentUpdated(
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentReceiptUrl: string,
    userId: string,
    businessId: string,
  ) {
    const payload = { orderId, paymentStatus, paymentReceiptUrl };

    this.server.to(`user-${userId}`).emit('payment_updated', payload);
    this.server.to(`business-${businessId}`).emit('payment_updated', payload);

    this.logger.log('Payment updated', {
      orderId,
      paymentStatus,
      userId,
      businessId,
    });
  }
}
