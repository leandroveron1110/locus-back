import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateBusinessEmployeeDto, UpdateBusinessEmployeeDto } from "../dto/request/business-employee.dto";

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async createEmployee(dto: CreateBusinessEmployeeDto) {
    return this.prisma.businessEmployee.create({
      data: {
        userId: dto.userId,
        businessId: dto.businessId,
        roleId: dto.roleId,
      },
      include: { role: true },
    });
  }

  async updateEmployee(id: string, dto: UpdateBusinessEmployeeDto) {
    const data: any = {};
    if (dto.roleId) data.roleId = dto.roleId;

    if (dto.overrides) {
      await this.prisma.businessEmployeeOverride.deleteMany({
        where: { employeeId: id },
      });

      data.overrides = {
        create: dto.overrides,
      };
    }

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

  async findBusinessesByUser(userId: string) {
    return this.prisma.businessEmployee.findMany({
      where: { userId },
      include: {
        role: true,
        overrides: true,
      },
    });
  }
}
