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
import { Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrderResponseDto } from 'src/order/dtos/response/order-response.dto';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';

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
  private logger: Logger = new Logger('OrderGateway');
  server: Server;

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

  /**
   * Un cliente, negocio o delivery se une según su rol
   * Ej:
   * socket.emit('join_role', { role: 'user', id: '123' })
   * socket.emit('join_role', { role: 'business', id: '10' })
   * socket.emit('join_role', { role: 'delivery' })
   */
  @SubscribeMessage('join_role')
  handleJoinRole(
    @MessageBody()
    data: { role: 'user' | 'business' | 'delivery'; id?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.role === 'user' && data.id) {
      client.join(`user-${data.id}`);
      this.logger.log(`Client ${client.id} joined user room user-${data.id}`);
    } else if (data.role === 'business' && data.id) {
      client.join(`business-${data.id}`);
      this.logger.log(
        `Client ${client.id} joined business room business-${data.id}`,
      );
    } else if (data.role === 'delivery' && data.id) {
      client.join(`delivery-${data.id}`);
      this.logger.log(`Client ${client.id} joined delivery room`);
    } else {
      this.logger.warn(
        `Client ${client.id} tried to join with invalid role or missing id`,
      );
    }
  }

  /**
   * Unirse a una sala de orden específica
   * Ej:
   * socket.emit('join_order', { orderId: 'abc123' })
   */
  @SubscribeMessage('join_order')
  handleJoinOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`order-${data.orderId}`);
    this.logger.log(
      `Client ${client.id} joined order room order-${data.orderId}`,
    );
  }

  emitOrderAssignedToDelivery(order: OrderResponseDto) {
    if (order.deliveryCompanyId) {
      this.server
        .to(`delivery-${order.deliveryCompanyId}`)
        .emit('newOrderAssigned', order);
    }
  }

  /**
   * Emitir evento cuando se crea una nueva orden
   */
  public emitNewOrder(order: OrderResponseDto) {
    // Notificar al negocio
    this.server.to(`business-${order.businessId}`).emit('new_order', order);
    // Notificar al cliente
    this.server.to(`user-${order.userId}`).emit('order_created', order);
  }

  /**
   * Emitir evento cuando se actualiza el estado de una orden
   */
  public emitOrderStatusUpdated(
    orderId: string,
    status: string,
    userId: string,
    businessId: string,
    deliveryCompanyId?: string | null,
  ) {
    // Notificar al cliente
    this.server
      .to(`user-${userId}`)
      .emit('order_status_updated', { orderId, status });

    // Notificar al negocio
    this.server
      .to(`business-${businessId}`)
      .emit('order_status_updated', { orderId, status });

    // Si el estado es listo_para_delivery, notificar a delivery
    if (status === OrderStatus.READY_FOR_DELIVERY_PICKUP && deliveryCompanyId) {
      this.server
        .to(`delivery-${deliveryCompanyId}`)
        .emit('order_ready_for_delivery', { orderId, businessId });
    }
  }

  public emitPaymentUpdated(
    orderId: string,
    paymentStatus: string,
    paymentReceiptUrl: string,
    userId: string,
    businessId: string,
  ) {
    const payload = {
      orderId,
      paymentStatus,
      paymentReceiptUrl,
    };

    // Notificar al cliente y al negocio
    this.server.to(`user-${userId}`).emit('payment_updated', payload);
    this.server.to(`business-${businessId}`).emit('payment_updated', payload);
  }
}
