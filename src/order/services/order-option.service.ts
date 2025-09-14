import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderOptionDto,
  UpdateOrderOptionDto,
} from '../dtos/request/order-option.dto';

@Injectable()
export class OrderOptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderOptionDto) {
    const {
      optionName,
      priceModifierType,
      quantity,
      priceFinal,
      priceWithoutTaxes,
      taxesAmount,
      opcionId,
      orderOptionGroupId,
    } = dto;

    return this.prisma.orderOption.create({
      data: {
        optionName,
        priceModifierType,
        quantity,
        priceFinal,
        priceWithoutTaxes,
        taxesAmount,
        opcionId,
        orderOptionGroupId: orderOptionGroupId,
      },
    });
  }

  async findAll() {
    return this.prisma.orderOption.findMany();
  }

  async findOne(id: string) {
    return this.prisma.orderOption.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateOrderOptionDto) {
    return this.prisma.orderOption.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.orderOption.delete({ where: { id } });
  }
}
