// src/notifications/notification.query.service.ts

import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

// Nota: Podrías importar TargetEntityType si lo usas en la lógica del controlador
// import { TargetEntityType } from '../dto/request/create-notification.dto';

@Injectable()
export class NotificationQueryService {
  constructor(private prisma: PrismaService) {}

  // ===============================================
  // 1. MÉTODOS DE LECTURA (Consultas principales)
  // ===============================================

  /**
   * Obtiene una lista paginada y filtrada de notificaciones para un destinatario específico (Historial).
   * @param targetEntityId ID del usuario o negocio.
   * @param targetEntityType Tipo de la entidad ('USER', 'BUSINESS').
   */
  async findByEntityRecipient(
    targetEntityId: string,
    targetEntityType: string, // 💡 Nuevo parámetro
    isRead?: boolean,
    take: number = 20,
    skip: number = 0,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        targetEntityId, // 💡 Filtrado por ID de entidad
        targetEntityType, // 💡 Filtrado por tipo de entidad
        ...(isRead !== undefined && { isRead }),
      },
      orderBy: [
        { priority: 'desc' as const },
        { timestamp: 'desc' },
      ],
      take: Number(take),
      skip: Number(skip),
    });
  }


  // ===============================================
  // 2. MÉTODOS EFICIENTES DE SINCRONIZACIÓN
  // ===============================================

  /**
   * Obtiene las notificaciones NO LEÍDAS posteriores a un momento dado (Polling eficiente).
   */
  async findUnreadSinceTime(
    targetEntityId: string,
    targetEntityType: string, // 💡 Nuevo parámetro
    syncTime: Date,
    take: number = 20,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        targetEntityId,
        targetEntityType,
        isRead: false,
        timestamp: {
          gt: syncTime, // Más nuevas que el syncTime
        },
      },
      orderBy: [
        { priority: 'desc' as const },
        { timestamp: 'desc' },
      ],
      take: Number(take),
    });
  }

  /**
   * Obtiene las notificaciones no leídas de forma regular (útil para la primera carga).
   */
  async findUnread(
    targetEntityId: string,
    targetEntityType: string, // 💡 Nuevo parámetro
    take: number = 20,
    skip: number = 0,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        targetEntityId,
        targetEntityType,
        isRead: false,
      },
      orderBy: [
        { priority: 'desc' as const },
        { timestamp: 'desc' },
      ],
      take: Number(take),
      skip: Number(skip),
    });
  }

  /**
   * Obtiene el conteo de notificaciones no leídas.
   */
  async getUnreadCount(targetEntityId: string, targetEntityType: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        targetEntityId,
        targetEntityType,
        isRead: false,
      },
    });
  }
}