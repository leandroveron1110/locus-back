import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessEmployeeOverrideService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    employeeId: string;
    permission: PermissionEnum;
    allowed: boolean;
  }) {
    await this.ensureEmployeeExists(data.employeeId);

    return this.prisma.businessEmployeeOverride.create({
      data: {
        employeeId: data.employeeId,
        permission: data.permission,
        allowed: data.allowed,
      },
    });
  }

  async findById(id: string) {
    const override =
      await this.prisma.businessEmployeeOverride.findUnique({
        where: { id },
      });

    if (!override) {
      throw new NotFoundException(
        `El permiso personalizado con ID ${id} no fue encontrado.`,
      );
    }

    return override;
  }

  async findByEmployeeId(employeeId: string) {
    return this.prisma.businessEmployeeOverride.findMany({
      where: {
        employeeId,
      },
    });
  }

  async update(
    id: string,
    data: {
      permission?: PermissionEnum;
      allowed?: boolean;
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.businessEmployeeOverride.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.businessEmployeeOverride.delete({
      where: { id },
    });
  }

  async deleteByEmployeeId(employeeId: string) {
    return this.prisma.businessEmployeeOverride.deleteMany({
      where: {
        employeeId,
      },
    });
  }

  private async ensureExists(id: string) {
    const exists =
      await this.prisma.businessEmployeeOverride.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });

    if (!exists) {
      throw new NotFoundException(
        `El permiso personalizado con ID ${id} no fue encontrado.`,
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