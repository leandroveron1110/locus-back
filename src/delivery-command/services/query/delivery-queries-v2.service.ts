// delivery-queries-v2.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BusinessCommandStatusV2,
  LogisticsCommandStatusV2,
  Prisma,
} from '@prisma/client';

@Injectable()
export class DeliveryQueriesV2Service {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // QUERIES DE NEGOCIO (Solo del día actual)
  // ==========================================================================

  /**
   * 1. Cotizaciones o precios actualizados visibles para la caja del negocio.
   * Trae los comandos donde logística ya puso/actualizó precio y el negocio los evalúa o gestiona.
   */
  async getBusinessQuotesResolved(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommandV2.findMany({
      where: {
        businessId,
        businessStatus: {
          notIn: [BusinessCommandStatusV2.COMPLETED, BusinessCommandStatusV2.CANCELLED],
        },
        createdAt: { gte: today },
      },
      select: {
        id: true,
        orderId: true,
        quotedCost: true,
        destinationAddress: true,
        businessStatus: true,
        logisticsStatus: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 2. Despachos y entregas completadas del día para el negocio.
   */
  async getBusinessDispatchesAccepted(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommandV2.findMany({
      where: {
        businessId,
        businessStatus: BusinessCommandStatusV2.COMPLETED,
        createdAt: { gte: today },
      },
      select: {
        id: true,
        orderId: true,
        destinationAddress: true,
        notes: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  // ==========================================================================
  // QUERIES DE LOGÍSTICA / BASE (Separadas por flujo operativo)
  // ==========================================================================

  /**
   * 1. Cola de Cotizaciones Pendientes para Base
   * Pedidos donde el negocio pidió cotizar y logística todavía no le dio un precio definitivo.
   */
  async getBaseUrgentQuotes(filters: {
    zoneId?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = filters.limit || 50;
    const page = filters.page || 1;
    const skip = (page - 1) * limit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommandV2.findMany({
      where: {
        businessStatus: BusinessCommandStatusV2.QUOTE_REQUESTED,
        logisticsStatus: {
          in: [LogisticsCommandStatusV2.PENDING],
        },
        createdAt: { gte: todayStart },
        ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
      },
      select: {
        id: true,
        businessId: true,
        originName: true,
        originAddress: true,
        destinationLatitude: true,
        destinationLongitude: true,
        originLatitude: true,
        originLongitude: true,
        destinationAddress: true,
        businessStatus: true,
        logisticsStatus: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });
  }

  /**
   * 2. Cola de Despachos Pendientes para Base (Pedidos listos para buscar/retirar)
   * Pedidos que el negocio marcó para despachar y la logística ya aceptó o procesa.
   */
/**
   * 2. Cola de Despachos Pendientes para Base (Pedidos listos para buscar/retirar)
   * Trae todos los despachos solicitados por el negocio que sigan activos (excluyendo los finalizados/cancelados).
   */
  async getBasePendingDispatches(filters: {
    zoneId?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = filters.limit || 50;
    const page = filters.page || 1;
    const skip = (page - 1) * limit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommandV2.findMany({
      where: {
        businessStatus: BusinessCommandStatusV2.DISPATCH_REQUESTED,
        logisticsStatus: {
          notIn: [
            LogisticsCommandStatusV2.COMPLETED, 
            LogisticsCommandStatusV2.REJECTED
          ],
        },
        createdAt: { gte: todayStart },
        ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
      },
      select: {
        id: true,
        businessId: true,
        orderId: true,
        originName: true,
        originAddress: true,
        destinationAddress: true,
        destinationLatitude: true,
        destinationLongitude: true,
        originLatitude: true,
        originLongitude: true,
        quotedCost: true,
        requiredCouriers: true,
        isShareable: true,
        logisticsStatus: true,
        notes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    });
  }

  /**
   * Búsqueda general con filtros y paginación para la V2
   */
  async findMany(filters: {
    page?: number;
    limit?: number;
    businessStatus?: BusinessCommandStatusV2;
    logisticsStatus?: LogisticsCommandStatusV2;
    businessId?: string;
    orderId?: string;
    zoneId?: string;
    from?: Date;
    to?: Date;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const where: Prisma.DeliveryCommandV2WhereInput = {};

    if (filters.businessStatus) {
      where.businessStatus = filters.businessStatus;
    }

    if (filters.logisticsStatus) {
      where.logisticsStatus = filters.logisticsStatus;
    }

    if (filters.businessId) {
      where.businessId = filters.businessId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.zoneId) {
      where.zoneId = filters.zoneId;
    }

    if (filters.from || filters.to) {
      where.createdAt = {};

      if (filters.from) {
        where.createdAt.gte = filters.from;
      }

      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deliveryCommandV2.findMany({
        where,
        orderBy: {
          createdAt: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.deliveryCommandV2.count({
        where,
      }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}