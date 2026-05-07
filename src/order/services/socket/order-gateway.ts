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
import { DeliveryStatus, OrderStatus, PaymentMethodType, PaymentStatus } from '@prisma/client';
import {
  IOrderDtoResponse,
  OrderResponseDto,
} from 'src/order/dtos/response/order-response.dto';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { LoggingService } from 'src/logging/logging.service';
import {
  INotification,
  NotificationPriority,
} from 'src/common/lib/notification.factory';

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
  emitNewOrder(
    order: IOrderDtoResponse & {
      orderPaymentMethod: PaymentMethodType;
      paymentStatus: PaymentStatus;
      businessId: string;
    },
  ) {
    const businessRoom = `business-${order.businessId}`;
    const userRoom = `user-${order.userId}`;

    const shouldNotifyBusiness =
      order.orderPaymentMethod === PaymentMethodType.CASH ||
      (order.orderPaymentMethod === PaymentMethodType.TRANSFER &&
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
      order.orderPaymentMethod === PaymentMethodType.CASH ||
      (order.orderPaymentMethod === PaymentMethodType.TRANSFER &&
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

emitUserNotification(order: {
  id: string;
  userId: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus; // Nuevo
  paymentStatus: PaymentStatus;   // Nuevo
}) {
  const userRoom = `user-${order.userId}`;
  const shortOrderId = `#${order.id.slice(0, 6).toUpperCase()}`;

  let title = '';
  let message = '';
  let priority: NotificationPriority = 'LOW';
  let shouldNotify = true;

  // 🧠 Lógica de Decisión basada en la importancia para el Usuario
  
  // 1. Prioridad Máxima: Logística (Delivery)
  if (order.deliveryStatus === DeliveryStatus.SHIPPED) {
    title = '¡Pedido en camino! 🛵';
    message = `Tu pedido ${shortOrderId} ya salió del local. ¡Prepárate!`;
    priority = 'HIGH';
  } 
  // 2. Preparación (Negocio)
  else if (order.status === OrderStatus.READY) {
    title = '¡Listo para retirar!';
    message = `Tu pedido ${shortOrderId} te está esperando en el local.`;
    priority = 'HIGH';
  }
  // 3. Problemas de Pago
  else if (order.paymentStatus === PaymentStatus.REJECTED) {
    title = 'Pago Rechazado ❌';
    message = `Hubo un problema con el pago de la orden ${shortOrderId}.`;
    priority = 'HIGH';
  }
  // 4. Cancelaciones Generales
  else if (order.status === OrderStatus.CANCELLED) {
    title = 'Pedido Cancelado';
    message = `Lamentamos informarte que el pedido ${shortOrderId} fue cancelado.`;
    priority = 'HIGH';
  }
  // 5. Confirmación
  else if (order.status === OrderStatus.CONFIRMED) {
    title = 'Pedido Confirmado ✅';
    message = `El negocio aceptó tu pedido ${shortOrderId} y pronto comenzará la preparación.`;
    priority = 'MEDIUM';
  }
  else {
    shouldNotify = false;
  }

  if (shouldNotify) {
    const notification: INotification = {
      id: crypto.randomUUID(),
      category: 'ORDER',
      type: 'ORDER_STATUS',
      title,
      message,
      timestamp: new Date().toISOString(),
      recipientId: order.userId,
      priority,
    };

    this.server.to(userRoom).emit('user_order_notification', notification);

    this.logger.log('Notificación de orden enviada (Multi-hilo)', {
      userId: order.userId,
      orderId: order.id,
      hilos: {
        status: order.status,
        delivery: order.deliveryStatus,
        payment: order.paymentStatus
      }
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
