// delivery-commands.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryCommandDto } from '../../dtos/request/create-delivery-command.dto';
import { DeliveryCommandStatus, DeliveryCommandType } from '@prisma/client';
import { th } from 'zod/v4/locales';

@Injectable()
export class DeliveryCommandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryCommandDto) {
    // Regla estricta: Sin orderId de la caja, no hay comando de delivery
    if (!dto.orderId) {
      throw new BadRequestException('orderId is required for creating a delivery command');
    }

    try {
      const deliveryCommand = await this.prisma.deliveryCommand.upsert({
        where: {
          businessId_orderId: {
            businessId: dto.businessId,
            orderId: dto.orderId,
          },
        },
        // Si ya existía la orden: reciclamos el registro de forma atómica
        update: {
          command: dto.command,
          // Si el front manda DISPATCH, vuelve a PENDING para que Base lo atienda.
          // Si vuelve a mandar QUOTE (F5/Doble click), no tocamos el estado actual.
          status: dto.command === DeliveryCommandType.DISPATCH 
            ? DeliveryCommandStatus.PENDING 
            : undefined,
          updatedAt: new Date(),
        },
        // Si es la primera vez que entra este UUID de orden: se inserta limpio
        create: {
          businessId: dto.businessId,
          orderId: dto.orderId,
          command: dto.command,
          originName: dto.originName,
          originAddress: dto.originAddress,
          originLatitude: dto.originLatitude,
          originLongitude: dto.originLongitude,
          destinationAddress: dto.destinationAddress,
          destinationLatitude: dto.destinationLatitude,
          destinationLongitude: dto.destinationLongitude,
          zoneId: dto.zoneId,
          notes: dto.notes,
          status: DeliveryCommandStatus.PENDING, // Nace siempre en PENDING esperando proceso
          updatedAt: new Date(),
        },
      });

      return deliveryCommand.id;
      
    } catch {
      throw new BadRequestException('Error creating/updating delivery command');
    }
  }

  async update(
    id: string, 
    updateData: { status: DeliveryCommandStatus; quotedCost?: number; externalId?: string; failureReason?: string }
  ) {
    return this.prisma.deliveryCommand.update({
      where: { id },
      data: {...updateData, updatedAt: new Date()},
    });
  }
}