import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CommandActor,
  CommandExecutionStatus,
  DeliveryCommandType,
  DeliveryDispatchStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestQuoteDto } from '../dtos/request-quote.dto';
import { RequestDispatchDto } from '../dtos/request-dispatch.dto';

/**
 * Service utilizado exclusivamente por Business.
 *
 * Responsabilidad:
 * - Crear/obtener el despacho.
 * - Registrar intenciones de Business.
 * - Exponer el estado actual del despacho.
 *
 * NO:
 * - cotiza.
 * - acepta/rechaza despachos.
 * - asigna cadetes.
 * - decide cómo funciona Delivery.
 */
@Injectable()
export class BusinessDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // OBTENER DESPACHO
  // ============================================================

  async getDispatch(businessId: string, orderId: string) {
    const dispatch = await this.prisma.deliveryDispatch.findFirst({
      where: {
        businessId,
        orderId,
      },
      include: {
        commands: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    return dispatch;
  }

  // ============================================================
  // SOLICITAR COTIZACIÓN
  // ============================================================

  async requestQuote(businessId: string, dto: RequestQuoteDto) {
    const dispatch = await this.getOrCreateDispatch(businessId, dto);

    this.validateQuoteRequest(dispatch);

    const idempotencyKey =
      dto.idempotencyKey ?? `quote:${businessId}:${dto.orderId}`;

    const existingCommand = await this.prisma.deliveryCommand.findFirst({
      where: {
        deliveryDispatchId: dispatch.id,
        idempotencyKey,
      },
    });

    if (existingCommand) {
      return {
        dispatch,
        command: existingCommand,
      };
    }

    const command = await this.prisma.deliveryCommand.create({
      data: {
        deliveryDispatchId: dispatch.id,

        actor: CommandActor.BUSINESS,

        command: DeliveryCommandType.REQUEST_QUOTE,

        status: CommandExecutionStatus.PENDING,

        idempotencyKey,

        payload: {
          orderId: dto.orderId,

          originName: dto.origin.name,
          originAddress: dto.origin.address,
          originLatitude: dto.origin.latitude,
          originLongitude: dto.origin.longitude,

          destinationName: dto.destination.name,
          destinationAddress: dto.destination.address,
          destinationLatitude: dto.destination.latitude,
          destinationLongitude: dto.destination.longitude,

          zoneId: dto.zoneId ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return {
      dispatch,
      command,
    };
  }

  // ============================================================
  // SOLICITAR DESPACHO
  // ============================================================

  async requestDispatch(businessId: string, dto: RequestDispatchDto) {
    const dispatch = await this.prisma.deliveryDispatch.findFirst({
      where: {
        id: dto.dispatchId,
        businessId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    if (
      dispatch.status !== DeliveryDispatchStatus.QUOTED &&
      dispatch.status !== DeliveryDispatchStatus.REQUESTED
    ) {
      throw new BadRequestException(
        `Dispatch cannot be requested from status ${dispatch.status}`,
      );
    }

    const idempotencyKey =
      dto.idempotencyKey ?? `dispatch:${businessId}:${dispatch.id}`;

    const existingCommand = await this.prisma.deliveryCommand.findFirst({
      where: {
        deliveryDispatchId: dispatch.id,
        idempotencyKey,
      },
    });

    if (existingCommand) {
      return {
        dispatch,
        command: existingCommand,
      };
    }

    const updatedDispatch = await this.prisma.deliveryDispatch.update({
      where: {
        id: dispatch.id,
      },
      data: {
        status: DeliveryDispatchStatus.REQUESTED,

        originPaymentAmount:
          dto.originPaymentAmount ?? dispatch.originPaymentAmount,

        originPaymentDeferred:
          dto.originPaymentDeferred ?? dispatch.originPaymentDeferred,

        notes: dto.notes ?? dispatch.notes,
      },
    });

    const command = await this.prisma.deliveryCommand.create({
      data: {
        deliveryDispatchId: dispatch.id,

        actor: CommandActor.BUSINESS,

        command: DeliveryCommandType.REQUEST_DISPATCH,

        status: CommandExecutionStatus.PENDING,

        idempotencyKey,

        payload: {
          originPaymentAmount: dto.originPaymentAmount ?? null,

          originPaymentDeferred: dto.originPaymentDeferred ?? null,

          notes: dto.notes ?? null,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return {
      dispatch: updatedDispatch,
      command,
    };
  }

  // ============================================================
  // CANCELAR DESPACHO
  // ============================================================

  async cancelDispatch(
    businessId: string,
    dispatchId: string,
    idempotencyKey?: string,
  ) {
    const dispatch = await this.prisma.deliveryDispatch.findFirst({
      where: {
        id: dispatchId,
        businessId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    if (
      dispatch.status === DeliveryDispatchStatus.DELIVERED ||
      dispatch.status === DeliveryDispatchStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Dispatch cannot be cancelled from status ${dispatch.status}`,
      );
    }

    const key = idempotencyKey ?? `cancel:${businessId}:${dispatch.id}`;

    const existingCommand = await this.prisma.deliveryCommand.findFirst({
      where: {
        deliveryDispatchId: dispatch.id,
        idempotencyKey: key,
      },
    });

    if (existingCommand) {
      return {
        dispatch,
        command: existingCommand,
      };
    }

    const updatedDispatch = await this.prisma.deliveryDispatch.update({
      where: {
        id: dispatch.id,
      },
      data: {
        status: DeliveryDispatchStatus.CANCELLED,
      },
    });

    const command = await this.prisma.deliveryCommand.create({
      data: {
        deliveryDispatchId: dispatch.id,

        actor: CommandActor.BUSINESS,

        command: DeliveryCommandType.CANCEL_DISPATCH,

        status: CommandExecutionStatus.PENDING,

        idempotencyKey: key,
      },
    });

    return {
      dispatch: updatedDispatch,
      command,
    };
  }

  // ============================================================
  // CREAR / OBTENER DISPATCH
  // ============================================================

  private async getOrCreateDispatch(businessId: string, dto: RequestQuoteDto) {
    const existing = await this.prisma.deliveryDispatch.findFirst({
      where: {
        businessId,
        orderId: dto.orderId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.deliveryDispatch.create({
      data: {
        businessId,

        orderId: dto.orderId,

        provider: dto.provider ?? 'INTERNAL',

        status: DeliveryDispatchStatus.DRAFT,

        originName: dto.origin.name,

        originAddress: dto.origin.address,

        originLatitude: dto.origin.latitude,

        originLongitude: dto.origin.longitude,

        destinationName: dto.destination.name,

        destinationAddress: dto.destination.address,

        destinationLatitude: dto.destination.latitude,

        destinationLongitude: dto.destination.longitude,

        zoneId: dto.zoneId ?? null,
      },
    });
  }

  // ============================================================
  // VALIDAR COTIZACIÓN
  // ============================================================

  private validateQuoteRequest(dispatch: { status: DeliveryDispatchStatus }) {
    if (dispatch.status !== DeliveryDispatchStatus.DRAFT) {
      throw new BadRequestException(
        `Quote cannot be requested from status ${dispatch.status}`,
      );
    }
  }
}
