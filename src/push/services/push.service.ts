import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as webpush from 'web-push';
// 💡 ASUMIMOS que el DTO ya tiene los campos: targetEntityIds: string[] y targetEntityType
import { CreateSubscriptionDto, TargetEntityType } from '../dtos/request/create-subscription.dto'; 
import { LoggingService } from 'src/logging/logging.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from '@prisma/client';

@Injectable()
export class PushService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('PushModule');
    logger.setService(PushService.name);
    
    // Configuración VAPID (Se mantiene igual, validación de variables de entorno)
    const email = this.configService.get<string>('VAPID_EMAIL');
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!email || !publicKey || !privateKey) {
      this.logger.error(
        'Faltan variables de entorno VAPID (EMAIL, PUBLIC_KEY, PRIVATE_KEY).',
      );
      throw new InternalServerErrorException(
        'Las claves VAPID son requeridas para las notificaciones Push.',
      );
    }

    webpush.setVapidDetails(email, publicKey, privateKey);
    this.logger.log('Claves VAPID configuradas correctamente.', { email });
  }

  // --- 1. CLAVE PÚBLICA VAPID ---
  
  getVapidPublicKey(): string {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    if (!publicKey) {
      this.logger.error('VAPID Public Key es NULL o undefined al solicitarse.');
      throw new InternalServerErrorException('VAPID Public Key no disponible.');
    }
    this.logger.debug('VAPID Public Key enviada al cliente.');
    return publicKey;
  }

  // --- 2. GESTIÓN DE LA SUSCRIPCIÓN (Guardar/Sincronizar) ---

  /**
   * Guarda o actualiza la suscripción del dispositivo y sincroniza la lista 
   * de entidades asociadas (Business/User) en PushSubscriptionTarget.
   */
  async saveSubscription(dto: CreateSubscriptionDto): Promise<void> {
    const { endpoint, keys, targetEntityIds, targetEntityType } = dto;

    if (!targetEntityIds || targetEntityIds.length === 0) {
      this.logger.warn('Suscripción omitida: No se proporcionaron IDs de entidad.', { targetEntityType });
      return;
    }

    try {
      // 1. UPSERT en la tabla del DISPOSITIVO (PushSubscription)
      const subscriptionRecord = await this.prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { p256dh: keys.p256dh, auth: keys.auth }, // Actualiza claves si cambian
        create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      });
      
      const subscriptionId = subscriptionRecord.id;
      
      // 2. SINCRONIZACIÓN en la tabla de UNIÓN (PushSubscriptionTarget)
      await this.prisma.$transaction([
        // A. Eliminar TODAS las asociaciones antiguas de ESTE TIPO y ESTE DISPOSITIVO
        this.prisma.pushSubscriptionTarget.deleteMany({
          where: {
            subscriptionId: subscriptionId,
            targetEntityType: targetEntityType,
          },
        }),

        // B. Crear todas las nuevas asociaciones (sincronizar con los IDs recibidos)
        this.prisma.pushSubscriptionTarget.createMany({
          data: targetEntityIds.map((id) => ({
            subscriptionId: subscriptionId,
            targetEntityId: id,
            targetEntityType: targetEntityType,
          })),
          skipDuplicates: true,
        }),
      ]);

      this.logger.log(`Dispositivo suscrito y sincronizado con ${targetEntityIds.length} entidades de tipo ${targetEntityType}.`, {
        subscriptionId,
        entityIds: targetEntityIds.join(','),
      });

    } catch (error) {
      this.logger.error('Fallo al guardar o actualizar la suscripción con múltiples entidades.', {
        targetEntityType,
        error: error.message,
      });
      throw new InternalServerErrorException('Error al procesar la suscripción push.');
    }
  }
  
  // --- 3. MANEJO DE EVENTO (Envío de Notificación) ---

  /**
   * Maneja el evento 'notification.created' y busca todos los dispositivos 
   * suscritos a la entidad de destino para enviarles el Push.
   */
  @OnEvent('notification.created')
  async handleNotificationCreated(notification: Notification): Promise<void> {
    const {
      targetEntityId,
      targetEntityType,
      title,
      message,
      link,
      id: notificationId,
    } = notification;

    this.logger.log(
      `Evento 'notification.created' recibido. Iniciando envío Push para #${notificationId}.`,
      {
        targetEntityId,
        targetEntityType,
        title,
        notificationId,
      },
    );

    try {
      // 1. Obtener las suscripciones (dispositivos) asociadas a esta ENTIDAD
      // 💡 BUSCAR EN LA TABLA DE UNIÓN, INCLUYENDO EL OBJETO PushSubscription
      const subscriptionTargets = await this.prisma.pushSubscriptionTarget.findMany({
        where: {
          targetEntityId: targetEntityId,
          targetEntityType: targetEntityType,
        },
        include: {
          subscription: true, 
        },
      });

      if (subscriptionTargets.length === 0) {
        this.logger.warn('No hay suscripciones push activas para la entidad destino.', {
          targetEntityId,
          targetEntityType,
        });
        return;
      }
      this.logger.debug(`Encontradas ${subscriptionTargets.length} suscripciones (targets) para enviar.`, {
        targetEntityId,
      });

      // 2. Preparar el Payload
      const payload = JSON.stringify({
        title: title,
        body: message,
        link: link || '/',
        icon: '/icons/push-icon.png',
        data: { notificationId: notificationId, link: link }, 
      });

      // 3. Enviar a cada suscripción y manejar errores 410 (expiradas)
      for (const target of subscriptionTargets) {
        const sub = target.subscription; // Objeto PushSubscription
        
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          this.logger.log('Push enviado con éxito.', {
            endpoint: sub.endpoint.substring(0, 50) + '...',
          });
        } catch (error) {
          this.logger.error(
            `Fallo al enviar Push. Código: ${error.statusCode || 'N/A'}`,
            {
              endpoint: sub.endpoint.substring(0, 50) + '...',
              targetEntityId: targetEntityId,
              rawError: error.message,
            },
          );

          if (error.statusCode === 410) {
            // Eliminar la suscripción del DISPOSITIVO (la tabla limpia)
            await this.prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
            // Las entradas en PushSubscriptionTarget deben eliminarse automáticamente 
            // mediante `onDelete: Cascade` configurado en el esquema de Prisma.
            this.logger.warn('Suscripción expirada eliminada (y sus targets).', {
              endpoint: sub.endpoint.substring(0, 50) + '...',
            });
          }
        }
      }
    } catch (globalError) {
      this.logger.error("Error global al manejar 'notification.created'.", {
        targetEntityId,
        globalError: globalError.message,
      });
    }
  }

  // --- 4. ENVÍO DE PRUEBA ---

  async sendTestNotification(
    targetEntityId: string,
    targetEntityType: string,
    title: string,
    message: string,
  ) {
    this.logger.log('Iniciando envío de notificación de prueba.', {
      targetEntityId,
      targetEntityType,
      title,
    });

    // 💡 BUSCAR EN LA TABLA DE UNIÓN
    const subscriptionTargets = await this.prisma.pushSubscriptionTarget.findMany({
      where: { targetEntityId, targetEntityType },
      include: { subscription: true },
    });

    if (!subscriptionTargets || subscriptionTargets.length === 0) {
      this.logger.warn('No se encontraron suscripciones para la prueba.', {
        targetEntityId,
      });
      throw new InternalServerErrorException(
        `Suscripción no encontrada para la entidad: ${targetEntityId} (${targetEntityType})`,
      );
    }

    const payload = JSON.stringify({
      title: title,
      body: message || 'Este es un mensaje de prueba.',
      link: '/', 
      icon: '/icons/push-icon.png',
      data: { isTest: true },
    });

    let successCount = 0;
    let failCount = 0;

    for (const target of subscriptionTargets) {
      const sub = target.subscription;
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
        this.logger.log('Push de prueba enviado con éxito.', {
          targetEntityId,
          endpoint: sub.endpoint.substring(0, 50) + '...',
        });
      } catch (error) {
        failCount++;
        this.logger.error('Fallo al enviar notificación de prueba.', {
          targetEntityId,
          rawError: error.message,
          statusCode: error.statusCode,
        });

        // Eliminar solo la PushSubscription si es 410
        if (error.statusCode === 410) {
          await this.prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          });
          this.logger.warn('Suscripción expirada eliminada.', {
            endpoint: sub.endpoint.substring(0, 50) + '...',
          });
        }
      }
    }

    this.logger.log('Resumen de envío de prueba', {
      targetEntityId,
      successCount,
      failCount,
    });

    if (successCount === 0) {
      throw new InternalServerErrorException(
        'Fallo al enviar notificación de prueba: ninguna entrega exitosa.',
      );
    }

    return { success: true, sent: successCount, failed: failCount };
  }
}