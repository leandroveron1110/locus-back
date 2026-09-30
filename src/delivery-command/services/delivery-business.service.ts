import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CommandExecutionStatus,
  DeliveryCommandType,
  DeliveryDispatchStatus,
  CommandActor,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryBusinessService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // OBTENER INTENCIONES PENDIENTES
  // ============================================================

  async getPendingCommands(provider = 'INTERNAL', limit = 50) {
    return this.prisma.deliveryCommand.findMany({
      where: {
        status: CommandExecutionStatus.PENDING,

        deliveryDispatch: {
          provider,
        },
      },

      include: {
        deliveryDispatch: true,
      },

      orderBy: {
        createdAt: 'asc',
      },

      take: Math.min(limit, 100),
    });
  }

  // ============================================================
  // ACKNOWLEDGE
  // ============================================================
  //
  // Delivery dice:
  //
  // "Recibí esta intención."
  //
  // Esto NO significa que la operación terminó.
  //
  // ============================================================

  async acknowledgeCommand(commandId: string) {
    const command = await this.prisma.deliveryCommand.findUnique({
      where: {
        id: commandId,
      },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found');
    }

    if (command.status !== CommandExecutionStatus.PENDING) {
      return command;
    }

    return this.prisma.deliveryCommand.update({
      where: {
        id: command.id,
      },

      data: {
        status: CommandExecutionStatus.ACKNOWLEDGED,
      },
    });
  }

  // ============================================================
  // RESPONDER COTIZACIÓN
  // ============================================================
  //
  // Delivery ya hizo el trabajo.
  //
  // Backend solamente persiste el resultado.
  //
  // ============================================================

  async provideQuote(
    commandId: string,
    quotedCost: number,
    quoteExpiresAt?: Date,
  ) {
    const command = await this.getCommand(commandId);

    this.assertCommand(command, DeliveryCommandType.REQUEST_QUOTE);

    const dispatch = await this.prisma.deliveryDispatch.findUnique({
      where: {
        id: command.deliveryDispatchId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    const [updatedDispatch, updatedCommand] = await this.prisma.$transaction([
      this.prisma.deliveryDispatch.update({
        where: {
          id: dispatch.id,
        },

        data: {
          status: DeliveryDispatchStatus.QUOTED,

          quotedCost,

          quoteExpiresAt: quoteExpiresAt ?? null,
        },
      }),

      this.prisma.deliveryCommand.update({
        where: {
          id: command.id,
        },

        data: {
          status: CommandExecutionStatus.ACKNOWLEDGED,

          response: {
            quotedCost,

            quoteExpiresAt: quoteExpiresAt?.toISOString() ?? null,
          },
        },
      }),
    ]);

    return {
      dispatch: updatedDispatch,
      command: updatedCommand,
    };
  }

  // ============================================================
  // RECHAZAR COMANDO
  // ============================================================

  async rejectCommand(commandId: string, reason: string) {
    const command = await this.getCommand(commandId);

    const dispatch = await this.prisma.deliveryDispatch.findUnique({
      where: {
        id: command.deliveryDispatchId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    const [updatedDispatch, updatedCommand] = await this.prisma.$transaction([
      this.prisma.deliveryDispatch.update({
        where: {
          id: dispatch.id,
        },

        data: {
          status: DeliveryDispatchStatus.REJECTED,
        },
      }),

      this.prisma.deliveryCommand.update({
        where: {
          id: command.id,
        },

        data: {
          status: CommandExecutionStatus.REJECTED,

          failureReason: reason,
        },
      }),
    ]);

    return {
      dispatch: updatedDispatch,
      command: updatedCommand,
    };
  }

  // ============================================================
  // ACEPTAR DESPACHO
  // ============================================================

  async acceptDispatch(commandId: string) {
    const command = await this.getCommand(commandId);

    this.assertCommand(command, DeliveryCommandType.REQUEST_DISPATCH);

    const dispatch = await this.prisma.deliveryDispatch.findUnique({
      where: {
        id: command.deliveryDispatchId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    if (dispatch.status !== DeliveryDispatchStatus.REQUESTED) {
      throw new BadRequestException(
        `Dispatch cannot be accepted from status ${dispatch.status}`,
      );
    }

    const [updatedDispatch, updatedCommand] = await this.prisma.$transaction([
      this.prisma.deliveryDispatch.update({
        where: {
          id: dispatch.id,
        },

        data: {
          status: DeliveryDispatchStatus.ACCEPTED,
        },
      }),

      this.prisma.deliveryCommand.update({
        where: {
          id: command.id,
        },

        data: {
          status: CommandExecutionStatus.ACKNOWLEDGED,
        },
      }),
    ]);

    return {
      dispatch: updatedDispatch,
      command: updatedCommand,
    };
  }

  // ============================================================
  // RECHAZAR DESPACHO
  // ============================================================

  async rejectDispatch(commandId: string, reason: string) {
    const command = await this.getCommand(commandId);

    this.assertCommand(command, DeliveryCommandType.REQUEST_DISPATCH);

    const dispatch = await this.prisma.deliveryDispatch.findUnique({
      where: {
        id: command.deliveryDispatchId,
      },
    });

    if (!dispatch) {
      throw new NotFoundException('Delivery dispatch not found');
    }

    const [updatedDispatch, updatedCommand] = await this.prisma.$transaction([
      this.prisma.deliveryDispatch.update({
        where: {
          id: dispatch.id,
        },

        data: {
          status: DeliveryDispatchStatus.REJECTED,
        },
      }),

      this.prisma.deliveryCommand.update({
        where: {
          id: command.id,
        },

        data: {
          status: CommandExecutionStatus.REJECTED,

          failureReason: reason,
        },
      }),
    ]);

    return {
      dispatch: updatedDispatch,
      command: updatedCommand,
    };
  }

  // ============================================================
  // RESPONDER CANCELACIÓN
  // ============================================================

  async acknowledgeCancellation(commandId: string) {
    const command = await this.getCommand(commandId);

    this.assertCommand(command, DeliveryCommandType.CANCEL_DISPATCH);

    return this.prisma.deliveryCommand.update({
      where: {
        id: command.id,
      },

      data: {
        status: CommandExecutionStatus.ACKNOWLEDGED,

        response: {
          acknowledged: true,
        },
      },
    });
  }

  // ============================================================
  // OBTENER COMANDO
  // ============================================================

  private async getCommand(commandId: string) {
    const command = await this.prisma.deliveryCommand.findUnique({
      where: {
        id: commandId,
      },
    });

    if (!command) {
      throw new NotFoundException('Delivery command not found');
    }

    return command;
  }

  // ============================================================
  // VALIDAR TIPO DE COMANDO
  // ============================================================

  private assertCommand(
    command: {
      command: DeliveryCommandType;
    },
    expected: DeliveryCommandType,
  ) {
    if (command.command !== expected) {
      throw new BadRequestException(
        `Command ${command.command} is not valid for this operation`,
      );
    }
  }
}
