import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessEmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    businessId: string;
    userId?: string | null;

    firstName: string;
    lastName: string;
    phone?: string | null;

    positionId?: string | null;

    active?: boolean;

    paymentType: 'DAILY' | 'HOURLY' | 'MONTHLY';
    paymentRate: number;

    username?: string | null;
    passwordHash?: string | null;

    roleId?: string | null;
  }) {
    return this.prisma.businessEmployee.create({
      data: {
        businessId: data.businessId,
        userId: data.userId ?? null,

        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,

        positionId: data.positionId ?? null,

        active: data.active ?? true,

        paymentType: data.paymentType,
        paymentRate: data.paymentRate,

        username: data.username ?? null,
        passwordHash: data.passwordHash ?? null,

        roleId: data.roleId ?? null,
      },

      include: {
        position: true,
        role: true,
        overrides: true,
      },
    });
  }

  async findById(id: string) {
    const employee = await this.prisma.businessEmployee.findUnique({
      where: { id },

      include: {
        position: true,
        role: true,
        overrides: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(
        `El empleado con ID ${id} no fue encontrado.`,
      );
    }

    return employee;
  }

  async findByBusinessId(businessId: string) {
    return this.prisma.businessEmployee.findMany({
      where: {
        businessId,
      },

      include: {
        position: true,
        role: true,
        overrides: true,
      },

      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async findActiveByBusinessId(businessId: string) {
    return this.prisma.businessEmployee.findMany({
      where: {
        businessId,
        active: true,
      },

      include: {
        position: true,
        role: true,
        overrides: true,
      },

      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.businessEmployee.findMany({
      where: {
        userId,
      },

      include: {
        business: true,
        position: true,
        role: true,
        overrides: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;

      positionId?: string | null;

      active?: boolean;

      paymentType?: 'DAILY' | 'HOURLY' | 'MONTHLY';
      paymentRate?: number;

      username?: string | null;
      passwordHash?: string | null;

      userId?: string | null;
      roleId?: string | null;
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.businessEmployee.update({
      where: { id },

      data: {
        ...(data.firstName !== undefined && {
          firstName: data.firstName,
        }),

        ...(data.lastName !== undefined && {
          lastName: data.lastName,
        }),

        ...(data.phone !== undefined && {
          phone: data.phone,
        }),

        ...(data.positionId !== undefined && {
          positionId: data.positionId,
        }),

        ...(data.active !== undefined && {
          active: data.active,
        }),

        ...(data.paymentType !== undefined && {
          paymentType: data.paymentType,
        }),

        ...(data.paymentRate !== undefined && {
          paymentRate: data.paymentRate,
        }),

        ...(data.username !== undefined && {
          username: data.username,
        }),

        ...(data.passwordHash !== undefined && {
          passwordHash: data.passwordHash,
        }),

        ...(data.userId !== undefined && {
          userId: data.userId,
        }),

        ...(data.roleId !== undefined && {
          roleId: data.roleId,
        }),
      },

      include: {
        position: true,
        role: true,
        overrides: true,
      },
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.businessEmployee.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);

    return this.prisma.businessEmployee.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.businessEmployee.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new NotFoundException(
        `El empleado con ID ${id} no fue encontrado.`,
      );
    }
  }
}