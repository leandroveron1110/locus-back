import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderOptionGroupDto, UpdateOrderOptionGroupDto } from '../dtos/request/order-option-group.dto';

@Injectable()
export class OrderOptionGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderOptionGroupDto) {
    const {
      groupName,
      minQuantity,
      maxQuantity,
      quantityType,
      opcionGrupoId,
      orderItemId
    } = dto;

    return this.prisma.orderOptionGroup.create({
      data: {
        groupName: groupName,
        minQuantity: minQuantity,
        maxQuantity: maxQuantity,
        quantityType: quantityType,
        opcionGrupoId: opcionGrupoId,
        orderItemId: orderItemId
      },
    });
  }

  async findAll() {
    return this.prisma.orderOptionGroup.findMany();
  }

  async findOne(id: string) {
    return this.prisma.orderOptionGroup.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateOrderOptionGroupDto) {
    return this.prisma.orderOptionGroup.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.orderOptionGroup.delete({ where: { id } });
  }
}
