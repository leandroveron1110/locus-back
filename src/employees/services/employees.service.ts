import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBusinessEmployeeDto,
  CreateDeliveryEmployeeDto,
} from '../dto/request/create-employee.dto';
import {
  UpdateBusinessEmployeeDto,
  UpdateDeliveryEmployeeDto,
} from '../dto/request/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------
  // Business Employees
  // -------------------------------
  async createBusinessEmployee(dto: CreateBusinessEmployeeDto) {
    return this.prisma.businessEmployee.create({
      data: {
        userId: dto.userId,
        businessId: dto.businessId,
        role: dto.role,
        permissions: dto.permissions,
      },
    });
  }

  async updateBusinessEmployee(id: string, dto: UpdateBusinessEmployeeDto) {
    return this.prisma.businessEmployee.update({
      where: { id },
      data: dto,
    });
  }

  async findBusinessEmployees(userId: string) {
    return this.prisma.businessEmployee.findMany({
      where: { userId },
    });
  }

  // -------------------------------
  // Delivery Employees
  // -------------------------------
  async createDeliveryEmployee(dto: CreateDeliveryEmployeeDto) {
    return this.prisma.deliveryEmployee.create({
      data: {
        userId: dto.userId,
        deliveryCompanyId: dto.deliveryCompanyId,
        role: dto.role,
        permissions: dto.permissions,
      },
    });
  }

  async updateDeliveryEmployee(id: string, dto: UpdateDeliveryEmployeeDto) {
    return this.prisma.deliveryEmployee.update({
      where: { id },
      data: dto,
    });
  }

  async findDeliveryEmployees(userId: string) {
    return this.prisma.deliveryEmployee.findMany({
      where: { userId },
    });
  }
}
