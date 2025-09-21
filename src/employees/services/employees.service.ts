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

  async createOrUpdateEmployee(dto: CreateBusinessEmployeeDto) {
    return await this.prisma.businessEmployee.upsert({
      where: {
        businessId_userId: {
          // nombre auto-generado por Prisma por el @@unique
          businessId: dto.businessId,
          userId: dto.userId,
        },
      },
      update: {
        roleId: dto.roleId, // si ya existe, solo actualiza el rol
      },
      create: {
        userId: dto.userId,
        businessId: dto.businessId,
        roleId: dto.roleId,
      },
      include: {
        role: true,
      },
    });
  }

  async updateEmployee(id: string, dto: UpdateBusinessEmployeeDto) {
    // ✅ Paso 1: Verificar que el empleado exista en la base de datos
    const existingEmployee = await this.prisma.businessEmployee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      // Si el empleado no existe, lanzar un error claro.
      // NestJS lo manejará y enviará una respuesta HTTP 404 (Not Found).
      throw new NotFoundException(
        `El empleado con ID ${id} no fue encontrado.`,
      );
    }

    // ✅ Paso 2: Si el empleado existe, proceder con la actualización del rol
    const data: any = {};
    if (dto.roleId) {
      data.roleId = dto.roleId;
    }

    // ✅ Paso 3: Manejar la sobrescritura de permisos de forma atómica
    if (dto.overrides && dto.overrides.length > 0) {
      // 3.1: Borrar todos los permisos de sobrescritura existentes para este empleado
      await this.prisma.businessEmployeeOverride.deleteMany({
        where: { employeeId: id },
      });

      // 3.2: Crear los nuevos permisos y asociarlos al empleado existente
      const overridesToCreate = dto.overrides.map((override) => ({
        ...override,
        employeeId: id, // ✅ Aquí la clave foránea apunta a un registro válido
      }));

      await this.prisma.businessEmployeeOverride.createMany({
        data: overridesToCreate,
      });
    } else if (dto.overrides && dto.overrides.length === 0) {
      // Caso especial: Si se envía un array vacío, borrar todos los overrides
      await this.prisma.businessEmployeeOverride.deleteMany({
        where: { employeeId: id },
      });
    }

    // ✅ Paso 4: Realizar la actualización final del registro del empleado
    // Ya no necesitas la lógica de `overrides` aquí, se manejó en los pasos anteriores.
    return this.prisma.businessEmployee.update({
      where: { id },
      data,
      include: { role: true, overrides: true },
    });
  }

  async listEmployees(businessId: string) {
    return this.prisma.businessEmployee.findMany({
      where: { businessId },
      include: { role: true, overrides: true },
    });
  }

  async findEmployeesByBusiness(
    businessId: string,
  ): Promise<EmployeeResponseDto[]> {
    const businessEmployees = await this.prisma.businessEmployee.findMany({
      where: { businessId },
      include: { role: true, overrides: true },
    });

    if (!businessEmployees.length) return [];

    const userIds = businessEmployees.map((b) => b.userId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarId: true,
        isDeleted: true,
      },
    });

    const combined = users.map((u) => {
      const be = businessEmployees.find((b) => b.userId === u.id);
      return {
        id: be?.id, // 👈 ✅ Añade el ID del registro BusinessEmployee aquí
        firstName: u.firstName,
        idUser: u.id,
        lastName: u.lastName,
        email: u.email,
        avatarId: u.avatarId,
        isDeleted: u.isDeleted,
        role: be?.role ?? null,
        overrides: be?.overrides ?? [],
      };
    });

    return EmployeeResponseDto.fromPrismaArray(combined);
  }

  async findBusinessesByUser(userId: string) {
    return this.prisma.businessEmployee.findMany({
      where: { userId },
      include: {
        role: true,
        overrides: true,
      },
    });
  }

  async removeRole(employeeId: string, businessId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.businessEmployeeOverride.deleteMany({
        where: { employeeId },
      }),
      this.prisma.businessEmployee.deleteMany({
        where: { id: employeeId, businessId },
      }),
    ]);
  }
}
