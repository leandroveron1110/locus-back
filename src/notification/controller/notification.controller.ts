// src/notifications/notification.controller.ts

import {
 Controller,
 Get,
 Post,
 Patch,
 Body,
 Param,
 Query,
 HttpCode,
 HttpStatus,
 BadRequestException,
 NotFoundException,
} from '@nestjs/common';
import { Notification } from '@prisma/client';
import { CreateNotificationDto, TargetEntityType } from '../dto/request/create-notification.dto'; // 💡 IMPORTACIÓN ACTUALIZADA
import { Public } from 'src/auth/decorators/public.decorator';
import { NotificationCommandService } from '../service/notification.command.service';
import { NotificationQueryService } from '../service/notification.query.service';

@Controller('notifications')
export class NotificationController {
 constructor(
  private readonly commandService: NotificationCommandService, 
  private readonly queryService: NotificationQueryService,
 ) {}

  // ===============================================
  // 1. ENDPOINTS DE LECTURA (Queries)
  // ===============================================

 @Get()
 @HttpCode(HttpStatus.OK)
 @Public()
 async findByEntityRecipient( // Nombre actualizado para reflejar la polimorfía
  @Query('id') targetEntityId: string, // 💡 Nuevo parámetro
  @Query('entityType') targetEntityType: TargetEntityType, // 💡 Nuevo parámetro
  @Query('take') take?: string,
  @Query('skip') skip?: string,
  @Query('isRead') isRead?: string,
 ): Promise<Notification[]> {
    if (!targetEntityId || !targetEntityType) {
        throw new BadRequestException('entityId y entityType son requeridos.');
    }
    
  const parsedTake = take ? parseInt(take, 10) : undefined;
  const parsedSkip = skip ? parseInt(skip, 10) : undefined;

  let parsedIsRead: boolean | undefined = undefined;
  if (isRead !== undefined) {
   parsedIsRead = isRead === 'true';
  }

  return this.queryService.findByEntityRecipient(
   targetEntityId, // 💡 Uso del nuevo parámetro
      targetEntityType, // 💡 Uso del nuevo parámetro
   parsedIsRead,
   parsedTake,
   parsedSkip,
  );
 }


 @Get('sync/unread')
 @HttpCode(HttpStatus.OK)
 @Public()
 async getNewUnreadSince(
  @Query('id') targetEntityId: string, // 💡 Nuevo parámetro
  @Query('entityType') targetEntityType: TargetEntityType, // 💡 Nuevo parámetro
  @Query('syncTime') syncTime?: string,
  @Query('take') take?: string,
 ): Promise<Notification[]> {
  if(!targetEntityId || !targetEntityType){
   throw new NotFoundException(
     'Los parámetros entityId y entityType deben ser enviados.',
    );
  }
    const parsedTake = take ? parseInt(take, 10) : undefined;

  if (!syncTime) {
   return this.queryService.findUnread(targetEntityId, targetEntityType, parsedTake); // 💡 Parámetros actualizados
  }

  try {
   const syncDate = new Date(syncTime);
   if (isNaN(syncDate.getTime())) {
    throw new BadRequestException(
     'El parámetro syncTime debe ser una fecha/hora válida (ISO 8601).',
    );
   }

   return this.queryService.findUnreadSinceTime(
    targetEntityId, // 💡 Parámetros actualizados
        targetEntityType, // 💡 Parámetros actualizados
    syncDate,
    parsedTake,
   );
  } catch (error) {
   if (error instanceof BadRequestException) {
    throw error;
   }
   throw new BadRequestException(
    'Error al procesar la solicitud de sincronización.',
   );
  }
 }

 /**
 * GET /notifications/count
 * Obtiene el número total de notificaciones NO LEÍDAS.
 */
 @Get('count')
 @HttpCode(HttpStatus.OK)
 @Public()
 async getUnreadCount(
  @Query('entityId') targetEntityId: string, // 💡 Nuevo parámetro
  @Query('entityType') targetEntityType: TargetEntityType, // 💡 Nuevo parámetro
 ): Promise<{ count: number }> {
  const count = await this.queryService.getUnreadCount(targetEntityId, targetEntityType); // 💡 Parámetros actualizados
  return { count };
 }

  // ===============================================
  // 3. ENDPOINTS DE ACTUALIZACIÓN (Comandos)
  // ===============================================

 /**
 * PATCH /notifications/mark-all-read
 * Marca todas las notificaciones NO LEÍDAS de un destinatario como leídas.
 */
 @Patch('mark-all-read')
 @HttpCode(HttpStatus.NO_CONTENT)
 @Public()
 async markAllAsRead(
    @Query('entityId') targetEntityId: string, // 💡 Nuevo parámetro
    @Query('entityType') targetEntityType: TargetEntityType, // 💡 Nuevo parámetro
  ): Promise<void> {
  await this.commandService.markAllAsRead(targetEntityId, targetEntityType); // 💡 Parámetros actualizados
 }

 /**
 * PATCH /notifications/:id/read
 * Marca una notificación específica como leída. (NO CAMBIA)
 */
 @Patch(':id/read')
 @HttpCode(HttpStatus.NO_CONTENT)
 @Public()
 async markOneAsRead(@Param('id') id: string): Promise<void> {
  await this.commandService.markAsRead(id);
 }

  // ===============================================
  // 4. ENDPOINT DE CREACIÓN
  // ===============================================

 @Post()
 @HttpCode(HttpStatus.CREATED)
 @Public()
 async createNotification(
  @Body() createNotificationDto: CreateNotificationDto,
 ): Promise<Notification> {
  return this.commandService.create(createNotificationDto);
 }
}