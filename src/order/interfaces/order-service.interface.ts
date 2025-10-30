import {
  Order,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
} from '@prisma/client';
import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
} from '../dtos/request/order.dto';
import { OrderResponseDto } from '../dtos/response/order-response.dto';
import { SyncResult } from '../services/querys/order-query.service';
import {
  SyncNotificationResponse,
  SyncNotificationUserResponse,
} from '../dtos/response/sync-notification-orders.dto.';

/**
 * Interfaz solo para creación de órdenes
 */
export interface IOrderCreationService {
  create(createOrderDto: CreateOrderDto): Promise<Order>;
  createFullOrder(dto: CreateOrderFullDTO): Promise<Order>;
}

/**
 * Interfaz para consultas/lectura de órdenes
 */
export interface IOrderQueryService {
  findAll(): Promise<Order[]>;
  checkOne(orderId: string): Promise<void>;
  findOne(orderId: string): Promise<OrderResponseDto>;
  findOrdersByBusiness(businessId: string): Promise<any[]>;
  findOrdersByUserId(userId: string): Promise<any[]>;
  findOrdersByDeliveyId(deliveryId: string): Promise<any[]>;
  findNotificationNewsOrders(businessIds: string[]): Promise<any[]>;
  syncOrdersByBusinessId(
    businessId: string,
    lastSyncTime?: string,
  ): Promise<SyncResult>;
  syncOrdersByUserId(
    id: string,
    hours?: number,
    lastSyncTime?: string,
  ): Promise<SyncResult>;
  syncNotificationNewsOrders(
    syncTimes: Record<string, string | undefined>,
  ): Promise<SyncNotificationResponse>;
  syncNotificationsUser(
    userId: string,
    lastSyncTime: string | undefined,
  ): Promise<SyncNotificationUserResponse>;
}

/**
 * Interfaz para actualización de órdenes
 */
export interface IOrderUpdateService {
  update(id: string, updateOrderDto: UpdateOrderDTO): Promise<Order>;
  updateStatus(
    id: string,
    updateOrderStatus: OrderStatus,
  ): Promise<OrderStatus>;
  updatePayment(
    orderId: string,
    data: {
      paymentType?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<PaymentMethodType>;
  updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<PaymentStatus>;
}

/**
 * Interfaz para eliminación de órdenes
 */
export interface IOrderDeleteService {
  remove(id: string): Promise<Order>;
}

/**
 * Interfaz para validaciones
 */
export interface IOrderValidationService {
  validateCreateFullOrder(dto: CreateOrderFullDTO): Promise<void>;
}
