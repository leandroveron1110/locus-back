import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeWorkSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    employeeId: string;
    startedAt: Date;
    endedAt?: Date | null;
  }) {
    await this.ensureEmployeeExists(data.employeeId);

    return this.prisma.employeeWorkSession.create({
      data: {
        employeeId: data.employeeId,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
      },
    });
  }

  async findById(id: string) {
    const session =
      await this.prisma.employeeWorkSession.findUnique({
        where: { id },
      });

    if (!session) {
      throw new NotFoundException(
        `La jornada con ID ${id} no fue encontrada.`,
      );
    }

    return session;
  }

  async findByEmployeeId(employeeId: string) {
    return this.prisma.employeeWorkSession.findMany({
      where: {
        employeeId,
      },

      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: {
      startedAt?: Date;
      endedAt?: Date | null;
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.employeeWorkSession.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.employeeWorkSession.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists =
      await this.prisma.employeeWorkSession.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });

    if (!exists) {
      throw new NotFoundException(
        `La jornada con ID ${id} no fue encontrada.`,
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