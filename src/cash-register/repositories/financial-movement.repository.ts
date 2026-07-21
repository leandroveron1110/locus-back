import { Injectable } from '@nestjs/common';
import {
  FinancialMovement,
  FinancialMovementStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FinancialMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un movimiento financiero.
   */
  async create(
    data: Prisma.FinancialMovementUncheckedCreateInput,
  ): Promise<FinancialMovement> {
    return this.prisma.financialMovement.create({
      data,
    });
  }

  /**
   * Buscar un movimiento por ID.
   */
  async findById(id: string): Promise<FinancialMovement | null> {
    return this.prisma.financialMovement.findUnique({
      where: { id },
    });
  }

  /**
   * Buscar un movimiento por su ID de sincronización Offline-First.
   */
  async findByClientMovementId(
    clientMovementId: string,
  ): Promise<FinancialMovement | null> {
    return this.prisma.financialMovement.findUnique({
      where: {
        clientMovementId,
      },
    });
  }

  /**
   * Obtener todos los movimientos de un turno.
   */
  async findByTurnId(cashRegisterTurnId: string): Promise<FinancialMovement[]> {
    return this.prisma.financialMovement.findMany({
      where: {
        cashRegisterTurnId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Actualizar el estado de un movimiento.
   */
  async updateStatus(
    id: string,
    status: FinancialMovementStatus,
  ): Promise<FinancialMovement> {
    return this.prisma.financialMovement.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Actualizar un movimiento.
   */
  async update(
    id: string,
    data: Prisma.FinancialMovementUpdateInput,
  ): Promise<FinancialMovement> {
    return this.prisma.financialMovement.update({
      where: { id },
      data,
    });
  }

  /**
   * Eliminar un movimiento.
   */
  async delete(id: string): Promise<FinancialMovement> {
    return this.prisma.financialMovement.delete({
      where: { id },
    });
  }
}
