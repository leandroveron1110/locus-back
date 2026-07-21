import { Injectable } from '@nestjs/common';
import { CashRegisterStatus, CashRegisterTurn, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CashRegisterRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Buscar un turno activo por negocio
  async findActiveTurn(businessId: string): Promise<CashRegisterTurn | null> {
    return this.prisma.cashRegisterTurn.findFirst({
      where: {
        businessId,
        status: CashRegisterStatus.OPEN,
      },
    });
  }

  // Buscar por ID
  async findById(id: string): Promise<CashRegisterTurn | null> {
    return this.prisma.cashRegisterTurn.findUnique({
      where: { id },
    });
  }

  // Buscar por clientTurnId
  async findByClientTurnId(
    clientTurnId: string,
  ): Promise<CashRegisterTurn | null> {
    return this.prisma.cashRegisterTurn.findUnique({
      where: { clientTurnId },
    });
  }

  // Crear
  async create(
    data: Prisma.CashRegisterTurnCreateInput,
  ): Promise<CashRegisterTurn> {
    return this.prisma.cashRegisterTurn.create({
      data,
    });
  }

  // Actualizar
  async update(
    id: string,
    data: Prisma.CashRegisterTurnUpdateInput,
  ): Promise<CashRegisterTurn> {
    return this.prisma.cashRegisterTurn.update({
      where: { id },
      data,
    });
  }

  /**
   * Devuelve un resumen de la caja agrupado por método de pago.
   * PostgreSQL realiza todos los cálculos.
   */
  async getSummary(turnId: string) {
    return this.prisma.$queryRaw<
      Array<{
        paymentMethod: string;
        sales: Prisma.Decimal;
        refunds: Prisma.Decimal;
        incomes: Prisma.Decimal;
        expenses: Prisma.Decimal;
        income: Prisma.Decimal;
        expense: Prisma.Decimal;
        net: Prisma.Decimal;
      }>
    >(Prisma.sql`
      SELECT
          payment_method AS "paymentMethod",

          COALESCE(
              SUM(amount) FILTER (WHERE type = 'SALE'),
              0
          ) AS sales,

          COALESCE(
              SUM(amount) FILTER (WHERE type = 'REFUND'),
              0
          ) AS refunds,

          COALESCE(
              SUM(amount) FILTER (WHERE type = 'INCOME'),
              0
          ) AS incomes,

          COALESCE(
              SUM(amount) FILTER (WHERE type = 'EXPENSE'),
              0
          ) AS expenses,

          COALESCE(
              SUM(amount)
                  FILTER (
                      WHERE type IN ('SALE','INCOME')
                  ),
              0
          ) AS income,

          COALESCE(
              SUM(amount)
                  FILTER (
                      WHERE type IN ('REFUND','EXPENSE')
                  ),
              0
          ) AS expense,

          COALESCE(
              SUM(
                  CASE
                      WHEN type IN ('SALE','INCOME')
                          THEN amount
                      ELSE -amount
                  END
              ),
              0
          ) AS net

      FROM financial_movements

      WHERE cash_register_turn_id = ${turnId}
        AND status = 'CONFIRMED'

      GROUP BY payment_method
      ORDER BY payment_method;
    `);
  }
}
