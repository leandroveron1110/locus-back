import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  CashRegisterTurn,
  FinancialMovementStatus,
  FinancialMovementType,
  PaymentMethodTypeFinancial,
} from '@prisma/client';
import { CreateFinancialMovementDto } from 'src/cash-register/dtos/create-financial-movement.dto';
import { CashRegisterRepository } from 'src/cash-register/repositories/cash-register.repository';
import { FinancialMovementRepository } from 'src/cash-register/repositories/financial-movement.repository';

@Injectable()
export class FinancialMovementCommand {
  constructor(
    private readonly repository: FinancialMovementRepository,
    private readonly cashRegisterRepository: CashRegisterRepository,
  ) {}

  /**
   * Obtiene la caja activa o lanza una excepción.
   */
  private async requireActiveTurn(
    businessId: string,
  ): Promise<CashRegisterTurn> {
    const activeTurn =
      await this.cashRegisterRepository.findActiveTurn(businessId);

    if (!activeTurn) {
      throw new ConflictException(
        'No se pueden registrar movimientos porque la caja está cerrada.',
      );
    }

    return activeTurn;
  }

  /**
   * Registrar un ingreso o egreso manual.
   */
  async createManualMovement(
    businessId: string,
    userId: string,
    dto: CreateFinancialMovementDto,
  ) {
    const activeTurn = await this.requireActiveTurn(businessId);

    if (
      dto.type !== FinancialMovementType.INCOME &&
      dto.type !== FinancialMovementType.EXPENSE
    ) {
      throw new BadRequestException(
        'Los movimientos manuales solamente pueden ser INCOME o EXPENSE.',
      );
    }

    return this.repository.create({
      clientMovementId: dto.clientMovementId,
      businessId,
      userId,
      type: dto.type,
      status: FinancialMovementStatus.CONFIRMED,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      description: dto.description,
      notes: dto.notes,
      externalReference: dto.externalReference,
      cashRegisterTurnId: activeTurn.id,
    });
  }

  /**
   * Registrar automáticamente una venta generada por una orden.
   */
  async registerSystemSale(
    businessId: string,
    userId: string,
    data: {
      clientMovementId: string;
      orderId: string;
      amount: number;
      paymentMethod: PaymentMethodTypeFinancial;
      description: string;
      externalReference?: string;
    },
  ) {
    const activeTurn = await this.requireActiveTurn(businessId);

    return this.repository.create({
      clientMovementId: data.clientMovementId,
      businessId,
      userId,
      orderId: data.orderId,
      type: FinancialMovementType.SALE,
      status: FinancialMovementStatus.CONFIRMED,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      description: data.description,
      externalReference: data.externalReference,
      cashRegisterTurnId: activeTurn.id,
    });
  }

  /**
   * Registrar automáticamente un reembolso.
   */
  async registerRefund(
    businessId: string,
    userId: string,
    data: {
      clientMovementId: string;
      orderId: string;
      amount: number;
      paymentMethod: PaymentMethodTypeFinancial;
      description: string;
      externalReference?: string;
      referenceCashRegisterTurnId?: string;
    },
  ) {
    const activeTurn = await this.requireActiveTurn(businessId);

    return this.repository.create({
      clientMovementId: data.clientMovementId,
      businessId,
      userId,
      orderId: data.orderId,
      type: FinancialMovementType.REFUND,
      status: FinancialMovementStatus.CONFIRMED,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      description: data.description,
      externalReference: data.externalReference,
      cashRegisterTurnId: activeTurn.id,
      referenceCashRegisterTurnId: data.referenceCashRegisterTurnId,
    });
  }

  /**
   * Confirmar un movimiento pendiente (QR, Mercado Pago, etc.).
   */
  async confirmMovement(id: string) {
    return this.repository.updateStatus(id, FinancialMovementStatus.CONFIRMED);
  }

  /**
   * Marcar un movimiento como fallido.
   */
  async failMovement(id: string) {
    return this.repository.updateStatus(id, FinancialMovementStatus.FAILED);
  }

  /**
   * Cancelar un movimiento.
   */
  async cancelMovement(id: string) {
    return this.repository.updateStatus(id, FinancialMovementStatus.CANCELLED);
  }
}
