import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterTurn, FinancialMovement } from '@prisma/client';
import { CashRegisterRepository } from 'src/cash-register/repositories/cash-register.repository';
import { FinancialMovementRepository } from 'src/cash-register/repositories/financial-movement.repository';

@Injectable()
export class FinancialMovementQuery {
  constructor(
    private readonly repository: FinancialMovementRepository,
    private readonly cashRegisterRepository: CashRegisterRepository,
  ) {}

  /**
   * Obtiene el turno de caja activo o lanza una excepción.
   */
  private async requireActiveTurn(
    businessId: string,
  ): Promise<CashRegisterTurn> {
    const activeTurn =
      await this.cashRegisterRepository.findActiveTurn(businessId);

    if (!activeTurn) {
      throw new NotFoundException(
        'No hay ninguna caja abierta actualmente para este negocio.',
      );
    }

    return activeTurn;
  }

  /**
   * Lista los movimientos del turno de caja actualmente abierto.
   */
  async findCurrentTurnMovements(
    businessId: string,
  ): Promise<FinancialMovement[]> {
    const activeTurn = await this.requireActiveTurn(businessId);

    return this.repository.findByTurnId(activeTurn.id);
  }

  /**
   * Lista los movimientos de un turno específico.
   */
  async findByTurnId(
    turnId: string,
  ): Promise<FinancialMovement[]> {
    return this.repository.findByTurnId(turnId);
  }

  /**
   * Buscar un movimiento por ID.
   */
  async findById(
    id: string,
  ): Promise<FinancialMovement> {
    const movement = await this.repository.findById(id);

    if (!movement) {
      throw new NotFoundException(
        'El movimiento financiero solicitado no existe.',
      );
    }

    return movement;
  }

  /**
   * Buscar un movimiento por su ID Offline-First.
   */
  async findByClientMovementId(
    clientMovementId: string,
  ): Promise<FinancialMovement> {
    const movement =
      await this.repository.findByClientMovementId(
        clientMovementId,
      );

    if (!movement) {
      throw new NotFoundException(
        'El movimiento financiero solicitado no existe.',
      );
    }

    return movement;
  }
}