// delivery-commands-v2.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BusinessCommandStatusV2,
  LogisticsCommandStatusV2,
} from '@prisma/client';
import { CreateDeliveryCommandDtoV2 } from 'src/delivery-command/dtos/request/create-delivery-command-v2.dto';

@Injectable()
export class DeliveryCommandsV2Service {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeliveryCommandDtoV2) {
    // Determinamos el estado inicial del negocio según la acción que mande el DTO
    const initialBusinessStatus =
      dto.action === 'DISPATCH'
        ? BusinessCommandStatusV2.DISPATCH_REQUESTED
        : dto.action === 'QUOTE'
          ? BusinessCommandStatusV2.QUOTE_REQUESTED
          : BusinessCommandStatusV2.PENDING;

    try {
      let existingCommand: any = null;

      // Si viene con orderId, buscamos si ya existe para reciclar el registro de forma atómica
      if (dto.orderId) {
        existingCommand = await this.prisma.deliveryCommandV2.findFirst({
          where: {
            businessId: dto.businessId,
            orderId: dto.orderId,
          },
        });
      }

      let deliveryCommand;

      if (existingCommand) {
        // Actualizamos el registro existente
        deliveryCommand = await this.prisma.deliveryCommandV2.update({
          where: { id: existingCommand.id },
          data: {
            businessStatus: initialBusinessStatus,
            logisticsStatus:
              dto.action === 'DISPATCH'
                ? LogisticsCommandStatusV2.PENDING
                : undefined,
            updatedAt: new Date(),
            destinationAddress: dto.destinationAddress,
            destinationLatitude: dto.destinationLatitude,
            destinationLongitude: dto.destinationLongitude,
            notes: dto.notes,
            quotedCost: dto.quotedCost,
            paymentAmount: dto.paymentAmount ?? null, // <--- Actualizamos el monto de pago si viene
            requiredCouriers: dto.requiredCouriers ?? 1,
            isShareable: dto.isShareable ?? true,
          },
        });
      } else {
        // Creamos un registro nuevo (sea porque es un pedido sin orderId o porque no existía la orden)
        deliveryCommand = await this.prisma.deliveryCommandV2.create({
          data: {
            businessId: dto.businessId,
            orderId: dto.orderId ?? null, // Explícitamente null si no viene
            businessStatus: initialBusinessStatus,
            logisticsStatus: LogisticsCommandStatusV2.PENDING,

            originName: dto.originName,
            originAddress: dto.originAddress,
            originLatitude: dto.originLatitude,
            originLongitude: dto.originLongitude,
            destinationAddress: dto.destinationAddress,
            destinationLatitude: dto.destinationLatitude,
            destinationLongitude: dto.destinationLongitude,
            zoneId: dto.zoneId,
            quotedCost: dto.quotedCost,
            notes: dto.notes,
            paymentAmount: dto.paymentAmount ?? null, // <--- Guardamos el monto de pago

            requiredCouriers: dto.requiredCouriers ?? 1,
            isShareable: dto.isShareable ?? true,
            updatedAt: new Date(),
          },
        });
      }

      return deliveryCommand;
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        'Error creating/updating delivery command V2',
      );
    }
  }

  async deleteAll() {
    return this.prisma.deliveryCommandV2.deleteMany();
  }

  async cancelByBusiness(businessId: string, orderId: string) {
    // Buscamos primero el comando de manera segura ya que orderId puede ser null o repetirse conceptualmente
    const command = await this.prisma.deliveryCommandV2.findFirst({
      where: {
        businessId,
        orderId,
      },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found for cancellation');
    }

    return this.prisma.deliveryCommandV2.update({
      where: {
        id: command.id,
      },
      data: {
        businessStatus: BusinessCommandStatusV2.CANCELLED,
        updatedAt: new Date(),
      },
    });
  }

  async update(
    id: string,
    updateData: {
      businessStatus?: BusinessCommandStatusV2;
      logisticsStatus?: LogisticsCommandStatusV2;
      quotedCost?: number;
      externalId?: string;
      failureReason?: string;
      requiredCouriers?: number;
      isShareable?: boolean;
      paymentAmount?: number;
    },
  ) {
    return this.prisma.deliveryCommandV2.update({
      where: {
        id: id,
      },
      data: { ...updateData, updatedAt: new Date() },
    });
  }

  async updateFinished(businessId: string, orderId: string) {
    const command = await this.prisma.deliveryCommandV2.findFirst({
      where: {
        businessId,
        orderId,
      },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found to finish');
    }

    return this.prisma.deliveryCommandV2.update({
      where: {
        id: command.id,
      },
      data: {
        businessStatus: BusinessCommandStatusV2.COMPLETED,
        logisticsStatus: LogisticsCommandStatusV2.COMPLETED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: Pone el precio a una cotización urgente solicitada por el negocio.
   */
  async baseQuoteOrder(id: string, quotedCost: number) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        quotedCost,
        logisticsStatus: LogisticsCommandStatusV2.QUOTED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: Toma el control / acepta un despacho solicitado por el negocio.
   */
  async baseAcceptDispatch(id: string) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.ACCEPTED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: actualiza direccion lat y long.
   */
  async baseSaveDestinationCoords(
    id: string,
    dto: {
      destinationAddress: string;
      destinationLatitude: number;
      destinationLongitude: number;
    },
  ) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        destinationAddress: dto.destinationAddress,
        destinationLatitude: dto.destinationLatitude,
        destinationLongitude: dto.destinationLongitude,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: Marca el pedido como asignado.
   */
  async baseSetAssigned(id: string) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.ASSIGNED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: Marca el pedido en tránsito.
   */
  async baseSetInTransit(id: string) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.IN_TRANSIT,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Base: Marca el pedido como completado.
   */
  async baseSetComplet(id: string) {
    return this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.COMPLETED,
        updatedAt: new Date(),
      },
    });
  }
}