import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethodType, PaymentStatus } from '@prisma/client';
import NewDate from 'src/common/validators/date';
import { LoggingService } from 'src/logging/logging.service';
import {
  SyncNotificationResponse,
  SyncNotificationUserResponse,
} from 'src/order/dtos/response/sync-notification-orders.dto.';
import {
  OrderResponseDto,
  OrderResponseDtoMapper,
} from 'src/order/dtos/response/order-response.dto';
import { IOrderQueryService } from 'src/order/interfaces/order-service.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  INotification,
  NotificationPriority,
} from 'src/common/lib/notification.factory';

export interface SyncResult {
  newOrUpdatedOrders: OrderResponseDto[];
  // latestTimestamp: string;
}

@Injectable()
export class OrderQueryService implements IOrderQueryService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggingService,
  ) {
    this.logger.setContext(OrderQueryService.name);
    this.logger.setService('OrderModule');
  }

  async syncOrdersByBusinessId(
    businessId: string,
    lastSyncTime?: string,
  ): Promise<SyncResult> {
    this.logger.debug('Starting incremental sync for business', {
      businessId,
      lastSyncTime,
    });

    let whereClause: any = { businessId };
    // let latestTimestamp: Date;

    // 1. Lógica de Filtro Incremental (si hay lastSyncTime)
    if (lastSyncTime) {
      const syncDate = new Date(lastSyncTime);

      // Filtra: Creadas DESPUÉS O Actualizadas DESPUÉS del lastSyncTime
      whereClause = {
        ...whereClause,
        OR: [{ createdAt: { gt: syncDate } }, { updatedAt: { gt: syncDate } }],
      };
    }

    // 2. Consulta de Órdenes
    const newOrUpdatedOrders = await this.prisma.order.findMany({
      where: whereClause,
      include: this.commonIncludes, // Reutiliza los includes comunes
      orderBy: { updatedAt: 'desc' }, // Ordenar por la actualización más reciente
    });

    // // 3. Determinar el Nuevo Timestamp de Sincronización
    // if (newOrUpdatedOrders.length > 0) {
    //   // Si encontramos órdenes, el timestamp más reciente es el updatedAt de la primera orden
    //   latestTimestamp = newOrUpdatedOrders[0].updatedAt;
    // } else {
    //   // Si no hay cambios, el timestamp más reciente es el actual o el que ya teníamos
    //   latestTimestamp = lastSyncTime ? new Date(lastSyncTime) : new Date();
    // }

    // 4. Mapear y Retornar
    const dtoList = newOrUpdatedOrders.map(OrderResponseDtoMapper.fromPrisma);

    this.logger.log(
      `Fetched ${dtoList.length} new/updated [Business] orders for sync`,
      {
        businessId,
      },
    );

    return {
      newOrUpdatedOrders: dtoList,
      // latestTimestamp: latestTimestamp.toISOString(),
    };
  }

  async syncOrdersByUserId(
    userId: string,
    hours: number = 24,
    lastSyncTime?: string,
  ): Promise<SyncResult> {
    this.logger.debug('Starting incremental sync for user', {
      userId,
      lastSyncTime,
      hours,
    });

    // Calcular fecha límite dinámica
    const now = new Date();
    const timeLimit = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Base del where
    let whereClause: any = {
      userId,
      OR: [{ createdAt: { gt: timeLimit } }, { updatedAt: { gt: timeLimit } }],
    };

    // Si existe un lastSyncTime, lo usamos como referencia adicional
    if (lastSyncTime) {
      const syncDate = new Date(lastSyncTime);

      // Traer órdenes más recientes que el lastSyncTime,
      // pero solo dentro del rango de horas solicitado
      whereClause = {
        userId,
        AND: [
          {
            OR: [
              { createdAt: { gt: syncDate } },
              { updatedAt: { gt: syncDate } },
            ],
          },
          {
            OR: [
              { createdAt: { gt: timeLimit } },
              { updatedAt: { gt: timeLimit } },
            ],
          },
        ],
      };
    }

    // Consulta
    const newOrUpdatedOrders = await this.prisma.order.findMany({
      where: whereClause,
      include: this.commonIncludes,
      orderBy: { updatedAt: 'desc' },
    });

    const dtoList = newOrUpdatedOrders.map(OrderResponseDtoMapper.fromPrisma);

    this.logger.log(
      `Fetched ${dtoList.length} new/updated [User] orders from last ${hours}h`,
      { userId },
    );

    return {
      newOrUpdatedOrders: dtoList,
    };
  }

  async findOrdersByDeliveyId(deliveryId: string) {
    this.logger.debug('Fetching orders by deliveryId', { deliveryId });
    return this.findOrdersWithIncludes({ deliveryCompanyId: deliveryId });
  }

  async findAll() {
    this.logger.debug('Fetching all orders');
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`Fetched ${orders.length} orders`);
    return orders;
  }

  async checkOne(orderId: string): Promise<void> {
    const exists = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
  }

  async findOne(id: string) {
    this.logger.debug('Fetching single order', { orderId: id });
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.commonIncludes,
    });
    if (!order) {
      this.logger.warn('Order not found', { orderId: id });
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    this.logger.log('Order found', { orderId: id });
    return OrderResponseDtoMapper.fromPrisma(order);
  }

  async findOrdersByBusiness(businessId: string) {
    this.logger.debug('Fetching orders by business', { businessId });
    return this.findOrdersWithIncludes({ businessId });
  }

  async findOrdersByUserId(userId: string) {
    this.logger.debug('Fetching orders by user', { userId });
    return this.findOrdersWithIncludes({ userId });
  }

  async findOrdersByDeliveryId(deliveryCompanyId: string) {
    this.logger.debug('Fetching orders by delivery company', {
      deliveryCompanyId,
    });
    return this.findOrdersWithIncludes({ deliveryCompanyId });
  }

  async findNotificationNewsOrders(businessIds: string[]) {
    this.logger.debug('Fetching new orders for notification', { businessIds });
    const orders = await this.prisma.order.findMany({
      where: {
        businessId: { in: businessIds },
        status: 'PENDING',
        OR: [
          {
            orderPaymentMethod: 'CASH',
          },
          {
            orderPaymentMethod: 'TRANSFER',
            paymentStatus: {
              not: 'PENDING',
            },
          },
        ],
      },
      select: {
        id: true,
        businessId: true,
        customerName: true,
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Fetched ${orders.length} new notification orders`, {
      businessIds,
    });
    return orders;
  }

  async syncNotificationNewsOrders(
    syncTimes: Record<string, string | undefined>,
  ): Promise<SyncNotificationResponse> {
    this.logger.debug('Starting incremental sync for notification orders', {
      syncTimes,
    });

    const businessIds = Object.keys(syncTimes);
    if (businessIds.length === 0) {
      return { newOrders: [] };
    }

    const orFilters: any[] = [];
    // const latestTimestamps: Record<string, string> = {};

    // 1. Construir la cláusula WHERE filtrada por tiempo para cada businessId
    businessIds.forEach((businessId) => {
      const lastSyncTime = syncTimes[businessId];
      let timeFilter: object | undefined = undefined;

      if (lastSyncTime) {
        const syncDate = new Date(lastSyncTime);

        // Filtro: Creada O Actualizada DESPUÉS del lastSyncTime (usando 'gt')
        timeFilter = {
          OR: [
            { createdAt: { gt: syncDate } },
            { updatedAt: { gt: syncDate } },
          ],
        };
      }

      // Aplicar los filtros originales (PENDING, tipos de pago) + el filtro de tiempo
      const baseNotificationFilters = {
        businessId: businessId,
        status: 'PENDING',
        OR: [
          { paymentType: 'CASH' },
          {
            paymentType: 'TRANSFER',
            paymentStatus: { not: 'PENDING' },
          },
        ],
        ...(timeFilter ? timeFilter : {}), // Añadir el filtro de tiempo si existe
      };

      orFilters.push(baseNotificationFilters);
    });

    // 2. Ejecutar la consulta masiva
    const orders = await this.prisma.order.findMany({
      where: {
        OR: orFilters, // Combina todas las condiciones de sincronización de cada negocio
      },
      select: {
        // Usar el mismo 'select' que tenías antes
        id: true,
        businessId: true,
        customerName: true,
        createdAt: true,
        updatedAt: true, // Necesitas el updatedAt para calcular el latestTimestamp
        total: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Fetched ${orders.length} new/updated notification orders`);

    // 3. Determinar el latestTimestamp para CADA negocio
    const finalOrders = orders.map((order) => {
      return { ...order };
    });

    // 4. Mapeo final y corrección del latestTimestamp devuelto al cliente
    const responseOrders = finalOrders.map((order) => {
      // Retornamos la orden sin el objeto Date de Prisma y con el timestamp de control
      return {
        id: order.id,
        businessId: order.businessId,
        customerName: order.customerName,
        createdAt: order.createdAt.toISOString(),
        total: `${order.total}`,
      };
    });

    return {
      newOrders: responseOrders,
    };
  }

  async syncNotificationsUser(
    userId: string,
    lastSyncTime?: string,
    hours: number = 24,
  ): Promise<SyncNotificationUserResponse> {
    this.logger.debug('Starting incremental sync for notification orders', {
      userId,
      lastSyncTime,
      hours,
    });

    if (!userId) {
      return { notification: [] };
    }

    // 1️⃣ Calcular el límite de tiempo dinámico (últimas N horas)
    const now = new Date();
    const timeLimit = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // 2️⃣ Definir estados que generan notificaciones
    const notificationStatuses = [
      OrderStatus.READY_FOR_CUSTOMER_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED_BY_BUSINESS,
      OrderStatus.CANCELLED_BY_DELIVERY,
    ];

    // 3️⃣ Filtros de estado y tiempo
    const statusFilter = {
      status: { in: notificationStatuses },
    };

    const syncDate = lastSyncTime ? new Date(lastSyncTime) : undefined;

    // Si hay lastSyncTime, tomamos el más reciente entre syncDate y timeLimit
    // Así nunca se buscan pedidos más viejos que el rango de horas definido
    const effectiveStartDate =
      syncDate && syncDate > timeLimit ? syncDate : timeLimit;

    const timeFilter = {
      OR: [
        { createdAt: { gt: effectiveStartDate } },
        { updatedAt: { gt: effectiveStartDate } },
      ],
    };

    // 4️⃣ Construcción del WHERE final
    const finalWhere = {
      userId,
      ...statusFilter,
      ...timeFilter,
    };

    // 5️⃣ Consulta
    const orders = await this.prisma.order.findMany({
      where: finalWhere,
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        total: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.log(
      `Fetched USER ${orders.length} new/updated notification orders (last ${hours}h)`,
    );

    // 6️⃣ Mapear las órdenes a notificaciones
    const notifications: INotification[] = orders
      .map((order) => {
        let title = '';
        let message = '';
        let priority: NotificationPriority = 'LOW';
        const shortOrderId = `#${order.id.slice(0, 6).toUpperCase()}`;

        switch (order.status) {
          case OrderStatus.READY_FOR_CUSTOMER_PICKUP:
            title = '¡Listo para recoger!';
            message = `Tu pedido ${shortOrderId} te está esperando. ¡Pasa por aquí cuando quieras!`;
            priority = 'HIGH';
            break;

          case OrderStatus.OUT_FOR_DELIVERY:
            title = '¡Tu pedido está en camino!';
            message = `El repartidor va en camino con tu pedido ${shortOrderId}.`;
            priority = 'MEDIUM';
            break;

          case OrderStatus.DELIVERED:
            title = '¡Pedido entregado! ✅';
            message = `Tu pedido ${shortOrderId} ha sido completado. ¡Esperamos que lo disfrutes!`;
            priority = 'LOW';
            break;

          case OrderStatus.CANCELLED_BY_BUSINESS:
            title = 'Pedido CANCELADO';
            message = `Lamentamos informarte que el negocio tuvo que cancelar tu pedido ${shortOrderId}. Revisa los detalles.`;
            priority = 'HIGH';
            break;

          case OrderStatus.CANCELLED_BY_DELIVERY:
            title = 'Pedido CANCELADO';
            message = `Hubo un problema con el delivery. Tu pedido ${shortOrderId} fue cancelado por el repartidor.`;
            priority = 'HIGH';
            break;

          default:
            return null;
        }

        return {
          id: order.id,
          category: 'ORDER',
          type: 'ORDER_STATUS',
          title,
          message,
          timestamp: order.updatedAt.toISOString(),
          recipientId: order.userId,
          priority,
        } as INotification;
      })
      .filter(Boolean) as INotification[];

    return { notification: notifications };
  }

  private async findOrdersWithIncludes(where: object, lastHours = 24) {
    const dateFilter = {
      gte: new Date(NewDate().getTime() - lastHours * 60 * 60 * 1000),
    };

    this.logger.debug('Building query for orders', { where, dateFilter });

    const orders = await this.prisma.order.findMany({
      where: {
        ...where,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: this.commonIncludes,
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Fetched ${orders.length} orders with includes`, { where });
    return orders.map(OrderResponseDtoMapper.fromPrisma);
  }

  private get commonIncludes() {
    return {
      OrderItem: {
        include: { optionGroups: { include: { options: true } } },
      },
      OrderDiscount: true,
    };
  }
}
