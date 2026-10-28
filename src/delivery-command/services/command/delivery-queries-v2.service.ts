// delivery-commands-v2.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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
    // Regla estricta: Sin orderId de la caja, no hay comando de delivery
    if (!dto.orderId) {
      throw new BadRequestException(
        'orderId is required for creating a delivery command V2',
      );
    }

    // Determinamos el estado inicial del negocio según la acción que mande el DTO
    const initialBusinessStatus =
      dto.action === 'DISPATCH'
        ? BusinessCommandStatusV2.DISPATCH_REQUESTED
        : dto.action === 'QUOTE'
          ? BusinessCommandStatusV2.QUOTE_REQUESTED
          : BusinessCommandStatusV2.PENDING;

    try {
      const deliveryCommand = await this.prisma.deliveryCommandV2.upsert({
        where: {
          businessId_orderId: {
            businessId: dto.businessId,
            orderId: dto.orderId,
          },
        },
        // Si ya existía la orden: reciclamos el registro de forma atómica
        update: {
          businessStatus: initialBusinessStatus,
          // Si el front vuelve a pedir un DISPATCH, podemos resetear la logística a PENDING si se requiere re-atención,
          // o dejarlo condicional. Acá lo adaptamos al nuevo flujo:
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
          requiredCouriers: dto.requiredCouriers ?? 1,
          isShareable: dto.isShareable ?? true,
        },
        // Si es la primera vez que entra este UUID de orden: se inserta limpio
        create: {
          businessId: dto.businessId,
          orderId: dto.orderId,
          businessStatus: initialBusinessStatus,
          logisticsStatus: LogisticsCommandStatusV2.PENDING, // Nace en pendiente para el operador logístico

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

          requiredCouriers: dto.requiredCouriers ?? 1,
          isShareable: dto.isShareable ?? true,
          updatedAt: new Date(),
        },
      });

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
    return this.prisma.deliveryCommandV2.update({
      where: {
        businessId_orderId: {
          businessId,
          orderId,
        },
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
    return this.prisma.deliveryCommandV2.update({
      where: {
        businessId_orderId: {
          businessId: businessId,
          orderId: orderId,
        },
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
   * Base: Marca el pedido en tránsito (el cadete salió a buscarlo/llevarlo).
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
   * Base: Marca el pedido en tránsito (el cadete salió a buscarlo/llevarlo).
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
