import {
  DeliveryStatus,
  Order,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
} from '@prisma/client';
import {
  CreateOrderFullDTO,
  SyncBusinessOrderDTO,
} from '../dtos/request/order.dto';
import { OrderResponseDto } from '../dtos/response/order-response.dto';
import {
  SyncResult,
  SyncResults,
} from '../services/querys/order-query.service';
import {
  SyncNotificationResponse,
  SyncNotificationUserResponse,
} from '../dtos/response/sync-notification-orders.dto.';

/**
 * Interfaz solo para creación de órdenes
 */
export interface IOrderCreationService {
  build(dto: unknown): Promise<Order>;
  syncOrderFromBusiness(data: SyncBusinessOrderDTO): Promise<any>;
  syncBatchOrdersFromBusiness(data: {
    businessId: string;
    orders: SyncBusinessOrderDTO[];
  }): Promise<
    {
      idTemp: string;
      cloudId?: string;
      status: 'SUCCESS' | 'ERROR';
      error?: string;
    }[]
  >;
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
  findNotificationNewsOrders(businessIds: string[]): Promise<any[]>;
  syncOrdersByBusinessId(
    businessId: string,
    hours: number,
    lastSyncTime?: string,
  ): Promise<SyncResults>;
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
  updateStatus(
    id: string,
    updateOrderStatus: OrderStatus,
  ): Promise<OrderStatus>;
  updatePayment(
    orderId: string,
    data: {
      orderPaymentMethod?: PaymentMethodType;
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

  syncOfflineFields(
    orderId: string,
    data: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      deliveryStatus?: DeliveryStatus;
      updatedAt: string; // ISO String desde el Front
    },
  );
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
