import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateBusinessEmployeeDto,
  UpdateBusinessEmployeeDto,
} from '../dto/request/business-employee.dto';

import { EmployeeResponseDto } from '../dto/response/employee-response-dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // CREAR EMPLEADO
  // ============================================================

  async createEmployee(dto: CreateBusinessEmployeeDto) {
    return this.prisma.businessEmployee.create({
      data: {
        businessId: dto.businessId,

        userId: dto.userId ?? null,

        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,

        positionId: dto.positionId ?? null,

        active: dto.active ?? true,

        paymentType: dto.paymentType,
        paymentRate: dto.paymentRate,

        username: dto.username ?? null,
        passwordHash: dto.passwordHash ?? null,

        roleId: dto.roleId ?? null,
      },

      include: {
        position: true,
        role: true,
        overrides: true,
      },
    });
  }

  // ============================================================
  // ACTUALIZAR EMPLEADO
  // ============================================================

  async updateEmployee(
    id: string,
    dto: UpdateBusinessEmployeeDto,
  ) {
    const existingEmployee =
      await this.prisma.businessEmployee.findUnique({
        where: { id },
      });

    if (!existingEmployee) {
      throw new NotFoundException(
        `El empleado con ID ${id} no fue encontrado.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // --------------------------------------------
      // Actualizar datos principales
      // --------------------------------------------

      const employee = await tx.businessEmployee.update({
        where: { id },

        data: {
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName,
          }),

          ...(dto.lastName !== undefined && {
            lastName: dto.lastName,
          }),

          ...(dto.phone !== undefined && {
            phone: dto.phone,
          }),

          ...(dto.positionId !== undefined && {
            positionId: dto.positionId,
          }),

          ...(dto.active !== undefined && {
            active: dto.active,
          }),

          ...(dto.paymentType !== undefined && {
            paymentType: dto.paymentType,
          }),

          ...(dto.paymentRate !== undefined && {
            paymentRate: dto.paymentRate,
          }),

          ...(dto.username !== undefined && {
            username: dto.username,
          }),

          ...(dto.passwordHash !== undefined && {
            passwordHash: dto.passwordHash,
          }),

          ...(dto.userId !== undefined && {
            userId: dto.userId,
          }),

          ...(dto.roleId !== undefined && {
            roleId: dto.roleId,
          }),
        },
      });

      // --------------------------------------------
      // Overrides
      // --------------------------------------------

      if (dto.overrides !== undefined) {
        await tx.businessEmployeeOverride.deleteMany({
          where: {
            employeeId: id,
          },
        });

        if (dto.overrides.length > 0) {
          await tx.businessEmployeeOverride.createMany({
            data: dto.overrides.map((override) => ({
              employeeId: id,
              permission: override.permission,
              allowed: override.allowed,
            })),
          });
        }
      }

      // --------------------------------------------
      // Devolver empleado actualizado
      // --------------------------------------------

      return tx.businessEmployee.findUnique({
        where: { id },

        include: {
          position: true,
          role: true,
          overrides: true,
        },
      });
    });
  }

  // ============================================================
  // LISTAR EMPLEADOS DEL NEGOCIO
  // ============================================================

  async listEmployees(businessId: string) {
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

  // ============================================================
  // EMPLEADOS DE UN NEGOCIO
  // ============================================================

  async findEmployeesByBusiness(
    businessId: string,
  ): Promise<EmployeeResponseDto[]> {
    const employees =
      await this.prisma.businessEmployee.findMany({
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

    return EmployeeResponseDto.fromPrismaArray(employees);
  }

  // ============================================================
  // NEGOCIOS DE UN USER GLOBAL
  // ============================================================

  async findBusinessesByUser(userId: string) {
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

  // ============================================================
  // ELIMINAR EMPLEADO DEL NEGOCIO
  // ============================================================

  async removeEmployee(
    employeeId: string,
    businessId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.businessEmployeeOverride.deleteMany({
        where: {
          employeeId,
        },
      }),

      this.prisma.businessEmployee.deleteMany({
        where: {
          id: employeeId,
          businessId,
        },
      }),
    ]);
  }
}