import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  BusinessCommandStatusV2,
  LogisticsCommandStatusV2,
} from '@prisma/client';

import { CreateDeliveryCommandDtoV2 } from 'src/delivery-command/dtos/request/create-delivery-command-v2.dto';

import { EventPublisherService } from 'src/realtime/services/event-publisher.service';
import {
  BUSINESS_REALTIME_ROOMS,
  REALTIME_ROOMS,
} from 'src/realtime/rooms/realtime-room.types';
import {
  BUSINESS_EVENTS,
  BusinessEventType,
  DELIVERY_EVENTS,
} from 'src/realtime/contracts/realtime-event.contract';

@Injectable()
export class DeliveryCommandsV2Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // --------------------------------------------------
  // REALTIME HELPERS
  // --------------------------------------------------

  private publishCreated(command: unknown) {
    this.eventPublisher.emitToRoom(
      REALTIME_ROOMS.DELIVERY_OPERATIONS,
      DELIVERY_EVENTS.DELIVERY_COMMAND_CREATED,
      command,
    );
  }

  private publishUpdated(command: unknown) {
    this.eventPublisher.emitToRoom(
      REALTIME_ROOMS.DELIVERY_OPERATIONS,
      DELIVERY_EVENTS.DELIVERY_COMMAND_UPDATED,
      command,
    );
  }

  private emitBusinessEvent(
    businessId: string,
    event: BusinessEventType,
    payload: unknown,
  ) {
    this.eventPublisher.emitToRoom(
      BUSINESS_REALTIME_ROOMS.operations(businessId),
      event,
      payload,
    );
  }

  // --------------------------------------------------
  // CREATE / QUOTE / DISPATCH
  // --------------------------------------------------

  async create(dto: CreateDeliveryCommandDtoV2) {
    const initialBusinessStatus =
      dto.action === 'DISPATCH'
        ? BusinessCommandStatusV2.DISPATCH_REQUESTED
        : dto.action === 'QUOTE'
          ? BusinessCommandStatusV2.QUOTE_REQUESTED
          : BusinessCommandStatusV2.PENDING;

    try {
      let existingCommand: any = null;

      if (dto.orderId) {
        existingCommand = await this.prisma.deliveryCommandV2.findFirst({
          where: {
            businessId: dto.businessId,
            orderId: dto.orderId,
          },
        });
      }

      let deliveryCommand;
      let wasCreated = false;

      if (existingCommand) {
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
            paymentAmount: dto.paymentAmount ?? null,
            requiredCouriers: dto.requiredCouriers ?? 1,
            assignedCouriers: dto.assignedCouriers ?? 0,
            isShareable: dto.isShareable ?? true,
          },
        });
      } else {
        deliveryCommand = await this.prisma.deliveryCommandV2.create({
          data: {
            businessId: dto.businessId,
            orderId: dto.orderId ?? null,
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
            paymentAmount: dto.paymentAmount ?? null,
            requiredCouriers: dto.requiredCouriers ?? 1,
            assignedCouriers: dto.assignedCouriers ?? 0,
            isShareable: dto.isShareable ?? true,
            updatedAt: new Date(),
          },
        });

        wasCreated = true;
      }

      // Publicamos según corresponda
      if (wasCreated) {
        this.publishCreated(deliveryCommand);
        this.emitBusinessEvent(
          dto.businessId,
          BUSINESS_EVENTS.BUSINESS_CREATE_COMMAND,
          deliveryCommand,
        );
      } else {
        this.publishUpdated(deliveryCommand);

        // Si la acción fue cotizar, disparamos el evento específico de quote
        const specificEvent =
          dto.action === 'QUOTE'
            ? BUSINESS_EVENTS.BUSINESS_QUOTE_COMMAND
            : BUSINESS_EVENTS.BUSINESS_UPDATED;

        this.emitBusinessEvent(dto.businessId, specificEvent, deliveryCommand);
      }

      return deliveryCommand;
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        'Error creating/updating delivery command V2',
      );
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async deleteAll() {
    return this.prisma.deliveryCommandV2.deleteMany();
  }

  // --------------------------------------------------
  // CANCEL
  // --------------------------------------------------

  async cancelByBusiness(businessId: string, orderId: string) {
    const command = await this.prisma.deliveryCommandV2.findFirst({
      where: { businessId, orderId },
    });

    if (!command) {
      throw new NotFoundException(
        'Delivery command not found for cancellation',
      );
    }

    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id: command.id },
      data: {
        businessStatus: BusinessCommandStatusV2.CANCELLED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_CANCEL_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // GENERIC UPDATE
  // --------------------------------------------------

  async update(
    id: string,
    updateData: {
      businessStatus?: BusinessCommandStatusV2;
      logisticsStatus?: LogisticsCommandStatusV2;
      quotedCost?: number;
      externalId?: string;
      failureReason?: string;
      requiredCouriers?: number;
      assignedCouriers?: number;
      isShareable?: boolean;
      paymentAmount?: number;
    },
  ) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_UPDATED,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // FINISHED
  // --------------------------------------------------

  async updateFinished(businessId: string, orderId: string) {
    const command = await this.prisma.deliveryCommandV2.findFirst({
      where: { businessId, orderId },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found to finish');
    }

    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id: command.id },
      data: {
        businessStatus: BusinessCommandStatusV2.COMPLETED,
        logisticsStatus: LogisticsCommandStatusV2.COMPLETED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_FINISHED_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  async updateFinishedManual(businessId: string, id: string) {
    const command = await this.prisma.deliveryCommandV2.findFirst({
      where: { businessId, id },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found to finish');
    }

    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id: command.id },
      data: {
        businessStatus: BusinessCommandStatusV2.COMPLETED,
        logisticsStatus: LogisticsCommandStatusV2.COMPLETED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_FINISHED_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: QUOTE
  // --------------------------------------------------

  async baseQuoteOrder(id: string, quotedCost: number) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        quotedCost,
        logisticsStatus: LogisticsCommandStatusV2.QUOTED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_QUOTE_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: ACCEPT DISPATCH
  // --------------------------------------------------

  async baseAcceptDispatch(id: string) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.ACCEPTED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_ACCEPT_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: DESTINATION COORDINATES
  // --------------------------------------------------

  async baseSaveDestinationCoords(
    id: string,
    dto: {
      destinationAddress: string;
      destinationLatitude: number;
      destinationLongitude: number;
    },
  ) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        destinationAddress: dto.destinationAddress,
        destinationLatitude: dto.destinationLatitude,
        destinationLongitude: dto.destinationLongitude,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_UPDATED,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: ASSIGN COURIERS
  // --------------------------------------------------

  async baseAssignCouriers(id: string, couriersToAdd: number = 1) {
    const command = await this.prisma.deliveryCommandV2.findUnique({
      where: { id },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found');
    }

    const newAssignedCount = Math.min(
      command.requiredCouriers,
      command.assignedCouriers + couriersToAdd,
    );

    const newLogisticsStatus =
      newAssignedCount >= command.requiredCouriers
        ? LogisticsCommandStatusV2.ASSIGNED
        : command.logisticsStatus;

    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        assignedCouriers: newAssignedCount,
        logisticsStatus: newLogisticsStatus,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_ASSIGN_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: IN TRANSIT
  // --------------------------------------------------

  async baseSetInTransit(id: string) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.IN_TRANSIT,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_IN_TRANSIT_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }

  // --------------------------------------------------
  // BASE: COMPLETED
  // --------------------------------------------------

  async baseSetComplet(id: string) {
    const updatedCommand = await this.prisma.deliveryCommandV2.update({
      where: { id },
      data: {
        logisticsStatus: LogisticsCommandStatusV2.COMPLETED,
        updatedAt: new Date(),
      },
    });

    this.publishUpdated(updatedCommand);
    this.emitBusinessEvent(
      updatedCommand.businessId,
      BUSINESS_EVENTS.BUSINESS_COMPLETE_COMMAND,
      updatedCommand,
    );

    return updatedCommand;
  }
}
