import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    businessId: string;
    name: string;
  }) {
    return this.prisma.position.create({
      data: {
        businessId: data.businessId,
        name: data.name,
      },
    });
  }

  async findById(id: string) {
    const position = await this.prisma.position.findUnique({
      where: { id },

      include: {
        employees: true,
      },
    });

    if (!position) {
      throw new NotFoundException(
        `El puesto con ID ${id} no fue encontrado.`,
      );
    }

    return position;
  }

  async findByBusinessId(businessId: string) {
    return this.prisma.position.findMany({
      where: {
        businessId,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
    },
  ) {
    await this.ensureExists(id);

    return this.prisma.position.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);

    return this.prisma.position.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.position.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!exists) {
      throw new NotFoundException(
        `El puesto con ID ${id} no fue encontrado.`,
      );
    }
  }
}