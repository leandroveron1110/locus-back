import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateBusinessRoleDto,
  UpdateBusinessRoleDto,
} from "../dto/request/business-role.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(dto: CreateBusinessRoleDto) {
    return this.prisma.businessRole.create({
      data: {
        businessId: dto.businessId,
        name: dto.name,
        permissions: dto.permissions,
      },
    });
  }

  async updateRole(roleId: string, dto: UpdateBusinessRoleDto) {
    return this.prisma.businessRole.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        permissions: dto.permissions,
      },
    });
  }

  async listRoles(businessId: string) {
    return this.prisma.businessRole.findMany({
      where: { businessId },
      include: {
        employees: true, // Opcional: solo si querés ver qué empleados están asociados
      },
    });
  }

  async getRoleById(roleId: string) {
    return this.prisma.businessRole.findUnique({
      where: { id: roleId },
      include: { employees: true },
    });
  }
}
