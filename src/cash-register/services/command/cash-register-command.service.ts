import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashRegisterStatus,
  CashRegisterTurn,
  FinancialMovementStatus,
  FinancialMovementType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CloseCashRegisterDto } from 'src/cash-register/dtos/close-cash-register.dto';
import { InitializeCashRegisterDto } from 'src/cash-register/dtos/initialize-cash-register.dto';
import { OpenCashRegisterDto } from 'src/cash-register/dtos/open-cash-register.dto';
import { CashRegisterRepository } from 'src/cash-register/repositories/cash-register.repository';

@Injectable()
export class CashRegisterCommand {
  constructor(private readonly repository: CashRegisterRepository) {}

  async initialize(dto: InitializeCashRegisterDto): Promise<CashRegisterTurn> {
    const activeTurn = await this.repository.findActiveTurn(dto.businessId);

    if (activeTurn) {
      return activeTurn;
    }

    return this.open({
      businessId: dto.businessId,
      userId: dto.userId,
      clientTurnId: dto.clientTurnId,
      openingAmount: 0,
      openingNotes: 'Caja inicializada automáticamente por el sistema.',
    });
  }
  async open(dto: OpenCashRegisterDto): Promise<CashRegisterTurn> {
    // 1. Validar idempotencia Offline-First: ¿Este turno ya se creó en el cliente y se sincronizó?
    const existingClientTurn = await this.repository.findByClientTurnId(
      dto.clientTurnId,
    );
    if (existingClientTurn) {
      return existingClientTurn;
    }

    // 2. Validar que no exista ya un turno abierto en este negocio
    const activeTurn = await this.repository.findActiveTurn(dto.businessId);
    if (activeTurn) {
      throw new ConflictException(
        'Ya existe una caja abierta para este negocio.',
      );
    }

    // 3. Crear el nuevo turno
    return this.repository.create({
      clientTurnId: dto.clientTurnId,
      businessId: dto.businessId,
      openedByUserId: dto.userId,
      openingAmount: dto.openingAmount,
      openingNotes: dto.openingNotes,
      status: 'OPEN',
    });
  }

  async close(
    businessId: string,
    userId: string,
    dto: CloseCashRegisterDto,
  ): Promise<CashRegisterTurn> {
    // 1. Obtener la caja activa actual con sus movimientos
    const activeTurn = await this.repository.findActiveTurn(businessId);
    if (!activeTurn) {
      throw new NotFoundException(
        'No se encontró ninguna caja abierta para cerrar.',
      );
    }

    // 2. Calcular de manera interna el monto del sistema (System Closing Amount)
    // Inicializa con el monto de apertura
    let systemAmount = new Decimal(activeTurn.openingAmount);

    // Sumamos/restamos los movimientos financieros adjuntos al turno que estén CONFIRMED
    const movements = (activeTurn as any).financialMovements || [];

    for (const mov of movements) {
      if (mov.status === FinancialMovementStatus.CONFIRMED) {
        if (
          mov.type === FinancialMovementType.SALE ||
          mov.type === FinancialMovementType.INCOME
        ) {
          systemAmount = systemAmount.add(mov.amount);
        } else if (
          mov.type === FinancialMovementType.REFUND ||
          mov.type === FinancialMovementType.EXPENSE
        ) {
          systemAmount = systemAmount.sub(mov.amount);
        }
      }
    }

    // 3. Calcular diferencia (Monto Declarado por usuario - Monto Calculado por Sistema)
    const declaredAmount = new Decimal(dto.declaredClosingAmount);
    const difference = declaredAmount.sub(systemAmount);

    // 4. Actualizar y cerrar el turno en base de datos
    return this.repository.update(activeTurn.id, {
      closedByUserId: userId,
      closingDate: new Date(),
      declaredClosingAmount: declaredAmount,
      systemClosingAmount: systemAmount,
      difference: difference,
      closingNotes: dto.closingNotes,
      status: CashRegisterStatus.CLOSED,
    });
  }

  async reopen(businessId: string, turnId: string): Promise<CashRegisterTurn> {
    // 1. Asegurar que no haya otra caja abierta actualmente que cause conflicto
    const activeTurn = await this.repository.findActiveTurn(businessId);
    if (activeTurn) {
      throw new ConflictException(
        'No se puede reabrir este turno porque ya existe otra caja abierta actualmente.',
      );
    }

    // 2. Buscar el turno específico que se quiere reabrir
    const turnToReopen = await this.repository.findById(turnId);
    if (!turnToReopen) {
      throw new NotFoundException('El turno de caja especificado no existe.');
    }

    if (turnToReopen.status === CashRegisterStatus.OPEN) {
      return turnToReopen; // Si ya está abierto de alguna manera, se retorna sin fallar
    }

    // 3. Reabrir limpiando los campos de la auditoría de cierre
    return this.repository.update(turnId, {
      status: CashRegisterStatus.OPEN,
      closingDate: null,
      closedByUserId: null,
      declaredClosingAmount: null,
      systemClosingAmount: null,
      difference: null,
      closingNotes: null,
    });
  }
}
