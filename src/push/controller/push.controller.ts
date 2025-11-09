// src/push/push.controller.ts

import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UsePipes, 
  ValidationPipe, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { PushService } from '../services/push.service';
import { Public } from 'src/auth/decorators/public.decorator';
// Asumo que SendNotificationDto tiene targetEntityId, targetEntityType, title, message
import { SendNotificationDto } from '../dtos/request/send-notification.dto'; 
// Asumo que CreateSubscriptionDto tiene endpoint, keys, targetEntityIds[], targetEntityType
import { CreateSubscriptionDto } from '../dtos/request/create-subscription.dto'; 

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  // 1. Obtener clave VAPID pública
  @Get('key')
  @Public()
  @HttpCode(HttpStatus.OK)
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }
  
  

  // 2. Suscribir/Sincronizar Dispositivo
  // Este endpoint ahora sincroniza el dispositivo con múltiples entidades
  @Post('subscribe')
  @Public() // Debe ser público ya que se llama desde el Service Worker
  @HttpCode(HttpStatus.CREATED) // Código 201: Recurso creado/actualizado
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async subscribe(@Body() body: CreateSubscriptionDto) {
    // El servicio manejará el upsert de PushSubscription y la sincronización de PushSubscriptionTarget
    await this.pushService.saveSubscription(body);
    // Nota: Es mejor devolver la clave pública VAPID aquí también si el frontend la necesita, 
    // pero mantener el success simple está bien para este caso.
    return { success: true, message: 'Suscripción sincronizada con éxito.' };
  }



  // 3. Envío de Prueba (Herramienta de depuración)
  
  @Post('send-test')
  // ⚠️ Importante: En un entorno real, esto debería estar protegido con Auth Guards
  @Public() 
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendTestNotification(@Body() dto: SendNotificationDto) {
    try {
      // El servicio ahora busca todas las suscripciones asociadas a targetEntityId (Business o User)
      await this.pushService.sendTestNotification(
        dto.targetEntityId, 
        dto.targetEntityType, 
        dto.title, 
        dto.message 
      );
      return { success: true, message: 'Notificación de prueba enviada.' };
    } catch (error) {
      // Manejar errores de forma más segura. La excepción debe venir del servicio.
      console.error('Fallo al enviar notificación de prueba:', error.message);
      // Retornar un error 500 o la excepción de NestJS si no se encuentra la suscripción
      return { 
        success: false, 
        message: 'Fallo al enviar notificación.', 
        error: error.message 
      };
    }
  }
}