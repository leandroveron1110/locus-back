// src/orders/orders-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SyncOrderEventsDto } from 'src/order/dtos/request/sync-order-events.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersSyncService {
  private readonly logger = new Logger(OrdersSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncHistoryEvents(dto: SyncOrderEventsDto) {
    if (!dto.events || dto.events.length === 0) {
      return { success: true, processed: 0 };
    }

    try {
      // 1. Extraemos los IDs de las órdenes involucradas para hacer una sola consulta eficiente
      const orderIds = [...new Set(dto.events.map(e => e.orderId))];

      // 2. Buscamos los eventos que ya existen en la DB para esas órdenes
      const existingEvents = await this.prisma.orderStateEvent.findMany({
        where: {
          orderId: { in: orderIds }
        },
        select: {
          orderId: true,
          stateType: true,
          value: true
        }
      });

      // 3. Filtramos los eventos entrantes del Front quedándonos solo con los que NO existen en la DB
      const newEvents = dto.events.filter(incoming => {
        const alreadyExists = existingEvents.some(existing => 
          existing.orderId === incoming.orderId &&
          existing.stateType === incoming.stateType &&
          existing.value === incoming.value
        );
        return !alreadyExists;
      });

      // 4. Si todos ya estaban sincronizados, salimos rápido sin pegarle a la DB
      if (newEvents.length === 0) {
        return { success: true, processed: 0, message: 'Todos los eventos ya estaban sincronizados.' };
      }

      // 5. Mapeamos e insertamos en lote los eventos realmente nuevos
      const dataToInsert = newEvents.map((event) => ({
        orderId: event.orderId,
        stateType: event.stateType,
        value: event.value,
        author: event.author || null,
        createdAt: new Date(event.createdAt),
      }));

      const result = await this.prisma.orderStateEvent.createMany({
        data: dataToInsert
      });

      this.logger.log(`[Sync Historial] Sincronizados con éxito ${result.count} eventos nuevos.`);

      return {
        success: true,
        processed: result.count
      };

    } catch (error) {
      this.logger.error('Error crítico al procesar la sincronización de historial de órdenes', error);
      throw error;
    }
  }
}