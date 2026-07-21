import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterTurn, PaymentMethodTypeFinancial } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FindCashRegisterHistoryDto } from 'src/cash-register/dtos/find-cash-register-history.dto';
import { CashRegisterRepository } from 'src/cash-register/repositories/cash-register.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CashRegisterQuery {
  constructor(
    private readonly repository: CashRegisterRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findCurrent(businessId: string): Promise<CashRegisterTurn> {
    const activeTurn = await this.repository.findActiveTurn(businessId);

    if (!activeTurn) {
      throw new NotFoundException(
        'No hay ninguna caja abierta actualmente para este negocio.',
      );
    }

    return activeTurn;
  }

  async findById(id: string): Promise<CashRegisterTurn> {
    const turn = await this.repository.findById(id);

    if (!turn) {
      throw new NotFoundException('El turno de caja solicitado no existe.');
    }

    return turn;
  }

  async findHistory(businessId: string, dto: FindCashRegisterHistoryDto) {
    let { page, limit } = dto;

    page = page ?? 1;
    limit = limit ?? 20;

    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.cashRegisterTurn.count({
        where: { businessId },
      }),
      this.prisma.cashRegisterTurn.findMany({
        where: { businessId },
        orderBy: {
          openingDate: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  async existsOpen(
    businessId: string,
  ): Promise<{ exists: boolean; id: string | null }> {
    const activeTurn = await this.repository.findActiveTurn(businessId);

    return {
      exists: !!activeTurn,
      id: activeTurn?.id ?? null,
    };
  }

  async calculateSummary(businessId: string) {
    const activeTurn = await this.repository.findActiveTurn(businessId);

    if (!activeTurn) {
      throw new NotFoundException(
        'No hay una caja activa para calcular el resumen.',
      );
    }

    const rows = await this.repository.getSummary(activeTurn.id);

    let sales = new Decimal(0);
    let refunds = new Decimal(0);
    let incomes = new Decimal(0);
    let expenses = new Decimal(0);

    const summaryByMethod: Record<
      PaymentMethodTypeFinancial,
      {
        income: Decimal;
        expense: Decimal;
        net: Decimal;
      }
    > = {} as Record<
      PaymentMethodTypeFinancial,
      {
        income: Decimal;
        expense: Decimal;
        net: Decimal;
      }
    >;

    for (const method of Object.values(PaymentMethodTypeFinancial)) {
      summaryByMethod[method] = {
        income: new Decimal(0),
        expense: new Decimal(0),
        net: new Decimal(0),
      };
    }

    for (const row of rows) {
      sales = sales.add(new Decimal(row.sales));
      refunds = refunds.add(new Decimal(row.refunds));
      incomes = incomes.add(new Decimal(row.incomes));
      expenses = expenses.add(new Decimal(row.expenses));

      summaryByMethod[row.paymentMethod as PaymentMethodTypeFinancial] = {
        income: new Decimal(row.income),
        expense: new Decimal(row.expense),
        net: new Decimal(row.net),
      };
    }

    return {
      openingAmount: activeTurn.openingAmount,

      summaryByType: {
        sales,
        refunds,
        incomes,
        expenses,
      },

      summaryByMethod,
    };
  }

  async calculateClosingAmount(
    businessId: string,
  ): Promise<{ systemClosingAmount: Decimal }> {
    const summary = await this.calculateSummary(businessId);

    const systemClosingAmount = new Decimal(summary.openingAmount)
      .add(summary.summaryByType.sales)
      .add(summary.summaryByType.incomes)
      .sub(summary.summaryByType.refunds)
      .sub(summary.summaryByType.expenses);

    return {
      systemClosingAmount,
    };
  }
}
