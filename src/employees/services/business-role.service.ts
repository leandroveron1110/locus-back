import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionEnum, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    businessId: string,
    name: string,
    permissions: PermissionEnum[] = [],
  ) {
    return this.prisma.businessRole.create({
      data: {
        businessId,
        name,
        permissions,
      },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.businessRole.findUnique({
      where: { id },
      include: {
        employees: true,
      },
    });

    if (!role) {
      throw new NotFoundException(
        `El rol con ID ${id} no fue encontrado.`,
      );
    }

    return role;
  }

  async findByBusinessId(businessId: string) {
    return this.prisma.businessRole.findMany({
      where: { businessId },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      permissions?: PermissionEnum[];
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.businessRole.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.businessRole.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.businessRole.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(
        `El rol con ID ${id} no fue encontrado.`,
      );
    }
  }
}