import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeSettlementStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeSettlementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    employeeId: string;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    status?: EmployeeSettlementStatus;
  }) {
    await this.ensureEmployeeExists(data.employeeId);

    return this.prisma.employeeSettlement.create({
      data: {
        employeeId: data.employeeId,

        periodStart: data.periodStart,
        periodEnd: data.periodEnd,

        amount: data.amount,

        status:
          data.status ?? EmployeeSettlementStatus.PENDING,
      },
    });
  }

  async findById(id: string) {
    const settlement =
      await this.prisma.employeeSettlement.findUnique({
        where: { id },

        include: {
          employee: true,
        },
      });

    if (!settlement) {
      throw new NotFoundException(
        `La liquidación con ID ${id} no fue encontrada.`,
      );
    }

    return settlement;
  }

  async findByEmployeeId(employeeId: string) {
    return this.prisma.employeeSettlement.findMany({
      where: {
        employeeId,
      },

      orderBy: {
        periodEnd: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      periodStart?: Date;
      periodEnd?: Date;
      amount?: number;
      status?: EmployeeSettlementStatus;
      paidAt?: Date | null;
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.employeeSettlement.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.employeeSettlement.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists =
      await this.prisma.employeeSettlement.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });

    if (!exists) {
      throw new NotFoundException(
        `La liquidación con ID ${id} no fue encontrada.`,
      );
    }
  }

  private async ensureEmployeeExists(employeeId: string) {
    const exists = await this.prisma.businessEmployee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new NotFoundException(
        `El empleado con ID ${employeeId} no fue encontrado.`,
      );
    }
  }
}