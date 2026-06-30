// delivery-queries.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeliveryCommandStatus, DeliveryCommandType } from '@prisma/client';

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
  async getBaseUrgentQuotes(filters: { zoneId?: string; limit?: number; page?: number }) {
    const limit = filters.limit || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    const zoneFilter = filters.zoneId ? `AND "zoneId" = '${filters.zoneId}'` : '';

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
  async getBasePendingDispatches(filters: { zoneId?: string; limit?: number; page?: number }) {
    const limit = filters.limit || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    const zoneFilter = filters.zoneId ? `AND "zoneId" = '${filters.zoneId}'` : '';

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
}
