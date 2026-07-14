// delivery-queries.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DeliveryCommandStatus,
  DeliveryCommandType,
  Prisma,
} from '@prisma/client';
import { FindDeliveryCommandsDto } from 'src/delivery-command/dtos/request/create-delivery-command.dto';

@Injectable()
export class DeliveryQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // QUERIES DE NEGOCIO (Solo éxitos del día actual)
  // ==========================================================================

  /**
   * 1. Cotizaciones resueltas del día.
   * Precios listos para que la caja los aplique a la orden.
   */
  async getBusinessQuotesResolved(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommand.findMany({
      where: {
        businessId,
        command: DeliveryCommandType.QUOTE,
        status: DeliveryCommandStatus.COMPLETED,
        createdAt: { gte: today },
      },
      select: {
        id: true,
        orderId: true,
        quotedCost: true,
        destinationAddress: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 2. Despachos aceptados del día.
   * Envíos que Base ya confirmó que tomó bajo su control.
   */
  async getBusinessDispatchesAccepted(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.deliveryCommand.findMany({
      where: {
        businessId,
        command: DeliveryCommandType.DISPATCH,
        status: DeliveryCommandStatus.COMPLETED,
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
  // QUERIES DE BASE (Separadas por flujo operativo y optimizadas)
  // ==========================================================================

  /**
   * 1. Cola de Cotizaciones Urgentes para Base
   * Trae todo lo que la caja mandó porque el sistema automático falló.
   */
  async getBaseUrgentQuotes(filters: {
    zoneId?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = filters.limit || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    const zoneFilter = filters.zoneId
      ? `AND "zoneId" = '${filters.zoneId}'`
      : '';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    // SQL puro: Trae solo cotizaciones pendientes/en proceso de hoy
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, "businessId", "originName", "originAddress", "destinationAddress", "status", "createdAt"
      FROM "DeliveryCommand"
      WHERE "command" = 'QUOTE' 
        AND "status" IN ('PENDING', 'PROCESSING')
        AND "createdAt" >= '${todayIso}'::timestamp
        ${zoneFilter}
      ORDER BY "createdAt" ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result;
  }

  /**
   * 2. Cola de Despachos Pendientes para Base (Pedidos a buscar/retirar)
   * Trae las órdenes físicas listas para que el operador las mande a los cadetes.
   */
  async getBasePendingDispatches(filters: {
    zoneId?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = filters.limit || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    const zoneFilter = filters.zoneId
      ? `AND "zoneId" = '${filters.zoneId}'`
      : '';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    // SQL puro: Trae solo despachos que esperan confirmación de hoy
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, "businessId", "orderId", "originName", "originAddress", "destinationAddress", "quotedCost", "status", "createdAt"
      FROM "DeliveryCommand"
      WHERE "command" = 'DISPATCH' 
        AND "status" = 'PENDING'
        AND "createdAt" >= '${todayIso}'::timestamp
        ${zoneFilter}
      ORDER BY "createdAt" ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return result;
  }

  async findMany(filters: FindDeliveryCommandsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const where: Prisma.DeliveryCommandWhereInput = {};

    if (filters.command) {
      where.command = filters.command;
    }

    if (filters.status) {
      where.status = filters.status;
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
      this.prisma.deliveryCommand.findMany({
        where,
        orderBy: {
          createdAt: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.deliveryCommand.count({
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
