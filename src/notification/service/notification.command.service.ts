// src/notifications/notification.command.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from '../dto/request/create-notification.dto';

@Injectable()
export class NotificationCommandService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ===============================================
  // 1. MÉTODOS DE ESCRITURA (Creación y Emisión de Evento)
  // ===============================================

  /**
   * Crea una nueva notificación en la base de datos y EMITE un evento, 
   * utilizando los IDs de entidad objetivo (polimórfico).
   * @param createNotificationDto Datos para la creación de la notificación.
   * @returns La notificación creada.
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // 💡 Ya no se desestructura recipientId. Usamos targetEntityId y targetEntityType
    const { targetEntityId, targetEntityType, ...data } = createNotificationDto as any; 
    
    // 1. Persistencia: Crear el registro en la DB.
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        targetEntityId,
        targetEntityType,
        // Eliminada la conexión 'recipient' porque ya no existe una FK directa en el modelo.
      } as Prisma.NotificationCreateInput,
    });

    // 2. Evento: Emitir el evento 'notification.created'
    this.eventEmitter.emit(
      'notification.created',
      notification,
    );

    return notification;
  }

  // ===============================================
  // 2. MÉTODOS DE ACTUALIZACIÓN (Siguen usando 'id' o el nuevo 'targetEntityId')
  // ===============================================

  /**
   * Marca una notificación específica como leída.
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`No se puede marcar como leída. Notificación con ID ${id} no encontrada.`);
      }
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones NO LEÍDAS de un destinatario como leídas.
   * Ahora recibe el ID de la entidad y su tipo.
   */
  async markAllAsRead(targetEntityId: string, targetEntityType: string) {
    return this.prisma.notification.updateMany({
      where: {
        targetEntityId,
        targetEntityType,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}