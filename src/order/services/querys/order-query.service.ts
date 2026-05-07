import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import NewDate from 'src/common/validators/date';
import { LoggingService } from 'src/logging/logging.service';
import {
  SyncNotificationResponse,
  SyncNotificationUserResponse,
} from 'src/order/dtos/response/sync-notification-orders.dto.';
import {
  IOrderDtoResponse,
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
  orders: IOrderDtoResponse[];
  latestTimestamp: string;
}

export interface SyncResults {
  orders: OrderResponseDto[];
  latestTimestamp: string | undefined;
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

  async syncOrdersShortByBusinessId(
    businessId: string,
    lastSyncTime?: string,
    daysBack?: number,
    specificDate?: string, // Formato "2026-04-25"
  ): Promise<SyncResult> {
    let dateFilter: any = {};

    if (specificDate) {
      // Filtrar TODO el día específico (desde las 00:00 hasta las 23:59)
      const start = new Date(specificDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(specificDate);
      end.setHours(23, 59, 59, 999);

      dateFilter = { gte: start, lte: end };
    } else {
      // Filtrar por rango de días (lo que ya teníamos)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - (daysBack || 2));
      dateFilter = { gte: limitDate };
    }

    let whereClause: any = {
      businessId,
      createdAt: dateFilter,
    };

    // Lógica de Filtro Incremental (para actualizaciones en tiempo real)
    if (lastSyncTime) {
      const syncDate = new Date(lastSyncTime);

      whereClause = {
        ...whereClause,
        // Mantenemos el filtro de los N días, pero sumamos la novedad
        OR: [{ updatedAt: { gt: syncDate } }, { createdAt: { gt: syncDate } }],
      };
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true, // Necesario para el próximo sync
        total: true,
        deliveryType: true,
        orderPaymentMethod: true,
        status: true,
        customerName: true,
        paymentStatus: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const latestTimestamp =
      orders.length > 0
        ? orders[0].updatedAt.toISOString()
        : lastSyncTime || new Date().toISOString();

    return {
      orders: orders.map((order) => ({
        ...order,
        userId: order.userId ? order.userId : '',
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      })),
      latestTimestamp,
    };
  }

  async orderDetailById(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: this.commonIncludes,
      });
      return order;
    } catch (error) {
      this.logger.error('Error fetching order by ID', { orderId, error });
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
  }

  async syncOrdersByUserId(
    userId: string,
    hours: number = 24,
    lastSyncTime?: string,
  ): Promise<any> {
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
      include: {
        OrderItem: {
          include: { optionGroups: { include: { options: true } } },
        },
      },
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

  async syncOrdersByBusinessId(
    businessId: string,
    hours: number = 24,
    lastSyncTime?: string,
  ): Promise<SyncResults> {
    const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000);
    const syncDate = lastSyncTime ? new Date(lastSyncTime) : timeLimit;

    // Filtramos: que sean del negocio Y que se hayan actualizado
    // después de la última sincronización, pero dentro del rango de X horas.
    const orders = await this.prisma.order.findMany({
      where: {
        businessId,
        updatedAt: { gt: syncDate },
        createdAt: { gt: timeLimit }, // Para no traer todo el historial histórico
      },
      select: {
        id: true,
        status: true,
        total: true,
        userId: true,
        origin: true,
        totalDeliveryCost: true,
        deliveryType: true,
        orderPaymentMethod: true,
        paymentStatus: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        customerObservations: true,
        createdAt: true,
        updatedAt: true,
        notes: true,
        OrderItem: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            priceAtPurchase: true,
            notes: true,
            optionGroups: {
              select: {
                groupName: true,
                options: {
                  select: {
                    optionName: true,
                    priceFinal: true,
                    quantity: true, // Si el modelo OrderOption tiene cantidad
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // El latestTimestamp es vital para que el front lo guarde para la próxima llamada
    const latestTimestamp =
      orders.length > 0 ? orders[0].updatedAt.toISOString() : lastSyncTime;

    const orderMapper = orders.map(OrderResponseDtoMapper.fromPrisma);

    return {
      latestTimestamp,
      orders: orderMapper,
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
          { orderPaymentMethod: 'CASH' },
          {
            orderPaymentMethod: 'TRANSFER',
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
    this.logger.debug('Iniciando sincronización incremental (3 hilos)', {
      userId,
      lastSyncTime,
    });

    if (!userId) return { notification: [] };

    const now = new Date();
    const timeLimit = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const syncDate = lastSyncTime ? new Date(lastSyncTime) : undefined;
    const effectiveStartDate =
      syncDate && syncDate > timeLimit ? syncDate : timeLimit;

    // 1️⃣ Definimos los estados "notificables" en los 3 hilos
    // Nota: Ahora incluimos cambios en deliveryStatus y paymentStatus
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        OR: [
          { createdAt: { gt: effectiveStartDate } },
          { updatedAt: { gt: effectiveStartDate } },
        ],
        // Filtramos para no traer pedidos "silenciosos" (como los PENDING iniciales)
        NOT: {
          AND: [
            { status: OrderStatus.PENDING },
            { deliveryStatus: DeliveryStatus.PENDING },
            { paymentStatus: PaymentStatus.PENDING },
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        deliveryStatus: true, // Nuevo hilo
        paymentStatus: true, // Nuevo hilo
        updatedAt: true,
        total: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2️⃣ Mapeo inteligente basado en la prioridad de los hilos
    const notifications: INotification[] = orders
      .map((order) => {
        let title = '';
        let message = '';
        let priority: NotificationPriority = 'LOW';
        const shortId = `#${order.id.slice(0, 6).toUpperCase()}`;

        // Lógica de Prioridad de Notificación:
        // La logística (Delivery) suele ser más importante para el usuario que el estado de cocina.

        // CASO A: El pedido está en viaje (Hilo Delivery manda)
        if (order.deliveryStatus === DeliveryStatus.SHIPPED) {
          title = '¡Tu pedido está en camino! 🛵';
          message = `El repartidor ya retiró tu pedido ${shortId} y va hacia tu ubicación.`;
          priority = 'HIGH';
        }
        // CASO B: El pedido está listo (Hilo Negocio manda)
        else if (order.status === OrderStatus.READY) {
          title = '¡Pedido preparado! ✨';
          message = `Tu pedido ${shortId} ya está listo. Si es para retirar, ¡te esperamos!`;
          priority = 'HIGH';
        }
        // CASO C: Pago rechazado (Hilo Pago manda)
        else if (order.paymentStatus === PaymentStatus.REJECTED) {
          title = 'Problema con el pago ❌';
          message = `Hubo un error con el pago de tu pedido ${shortId}. Por favor, revisalo.`;
          priority = 'HIGH';
        }
        // CASO D: Cancelaciones
        else if (order.status === OrderStatus.CANCELLED) {
          title = 'Pedido Cancelado';
          message = `El pedido ${shortId} ha sido cancelado.`;
          priority = 'MEDIUM';
        }
        // CASO E: Confirmación inicial
        else if (
          order.status === OrderStatus.CONFIRMED &&
          order.paymentStatus === PaymentStatus.CONFIRMED
        ) {
          title = 'Pedido Confirmado ✅';
          message = `¡Todo listo! El negocio ya aceptó tu pedido ${shortId}.`;
          priority = 'LOW';
        } else {
          return null; // No notificamos estados intermedios como PREPARING
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
    };
  }
}
