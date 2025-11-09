// // src/notifications/notification.service.ts

// import { Injectable, NotFoundException } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter'; // 👈 Importación clave
// import { Notification, NotificationPriority, NotificationCategory } from '@prisma/client';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateNotificationDto } from '../dto/request/create-notification.dto';

// @Injectable()
// export class NotificationService {
//   constructor(
//     private prisma: PrismaService,
//     private eventEmitter: EventEmitter2, 
//   ) {}

//   // ===============================================
//   // 1. MÉTODOS DE ESCRITURA (Creación y Emisión de Evento)
//   // ===============================================

//   /**
//    * Crea una nueva notificación en la base de datos y EMITE un evento.
//    * La emisión del evento dispara el envío de notificaciones Push/Email/SMS en servicios externos.
//    * @param createNotificationDto Datos para la creación de la notificación.
//    * @returns La notificación creada.
//    */
//   async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
//     const { recipientId, ...data } = createNotificationDto;
    
//     // 1. Persistencia: Crear el registro en la DB.
//     const notification = await this.prisma.notification.create({
//       data: {
//         ...data,
//         recipient: {
//           connect: { id: recipientId },
//         },
//       },
//     });

//     // 2. Evento: Emitir el evento 'notification.created'
//     this.eventEmitter.emit(
//       'notification.created',
//       notification, // Pasamos el objeto Notification completo
//     );
    
//     return notification;
//   }

//   // ===============================================
//   // 2. MÉTODOS DE LECTURA (Consultas principales)
//   // ===============================================

//   /**
//    * Obtiene una lista paginada y filtrada de notificaciones para un usuario específico (Historial).
//    */
//   async findByRecipient(
//     recipientId: string,
//     isRead?: boolean,
//     take: number = 20, 
//     skip: number = 0,
//   ): Promise<Notification[]> {
//     return this.prisma.notification.findMany({
//       where: {
//         recipientId,
//         ...(isRead !== undefined && { isRead }),
//       },
//       orderBy: [
//         { priority: 'desc' as const },
//         { timestamp: 'desc' },
//       ],
//       take: Number(take), 
//       skip: Number(skip),
//     });
//   }

//   /**
//    * Obtiene una única notificación por ID.
//    */
//   async findOne(id: string): Promise<Notification> {
//     const notification = await this.prisma.notification.findUnique({
//       where: { id },
//     });

//     if (!notification) {
//       throw new NotFoundException(`Notificación con ID ${id} no encontrada.`);
//     }

//     return notification;
//   }
  
//   // ===============================================
//   // 3. MÉTODOS EFICIENTES DE SINCRONIZACIÓN
//   // ===============================================

//   /**
//    * Obtiene las notificaciones NO LEÍDAS posteriores a un momento dado (Polling eficiente).
//    */
//   async findUnreadSinceTime(
//     recipientId: string,
//     syncTime: Date,
//     take: number = 20,
//   ): Promise<Notification[]> {
//     return this.prisma.notification.findMany({
//       where: {
//         recipientId,
//         isRead: false,
//         timestamp: {
//           gt: syncTime, // Más nuevas que el syncTime
//         },
//       },
//       orderBy: [
//         { priority: 'desc' as const }, 
//         { timestamp: 'desc' }, 
//       ],
//       take: Number(take),
//     });
//   }

//   /**
//    * Obtiene las notificaciones no leídas de forma regular (útil para la primera carga).
//    */
//   async findUnread(
//     recipientId: string,
//     take: number = 20,
//     skip: number = 0,
//   ): Promise<Notification[]> {
//     return this.prisma.notification.findMany({
//       where: {
//         recipientId,
//         isRead: false,
//       },
//       orderBy: [
//         { priority: 'desc' as const }, 
//         { timestamp: 'desc' },
//       ],
//       take: Number(take),
//       skip: Number(skip),
//     });
//   }

//   /**
//    * Obtiene el conteo de notificaciones no leídas.
//    */
//   async getUnreadCount(recipientId: string): Promise<number> {
//     return this.prisma.notification.count({
//       where: {
//         recipientId,
//         isRead: false,
//       },
//     });
//   }

//   // ===============================================
//   // 4. MÉTODOS DE ACTUALIZACIÓN
//   // ===============================================

//   /**
//    * Marca una notificación específica como leída.
//    */
//   async markAsRead(id: string): Promise<Notification> {
//     try {
//       return await this.prisma.notification.update({
//         where: { id },
//         data: { isRead: true },
//       });
//     } catch (error) {
//       if (error.code === 'P2025') {
//         throw new NotFoundException(`No se puede marcar como leída. Notificación con ID ${id} no encontrada.`);
//       }
//       throw error;
//     }
//   }

//   /**
//    * Marca todas las notificaciones NO LEÍDAS de un usuario como leídas.
//    */
//   async markAllAsRead(recipientId: string) {
//     return this.prisma.notification.updateMany({
//       where: {
//         recipientId,
//         isRead: false,
//       },
//       data: {
//         isRead: true,
//       },
//     });
//   }
// }