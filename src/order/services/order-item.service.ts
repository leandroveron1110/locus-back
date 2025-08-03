import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
} from '../dtos/request/order-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderItemDto) {
    const {
      orderId,
      menuProductId,
      productName,
      productDescription,
      productImageUrl,
      quantity,
      priceAtPurchase,
      notes,
    } = dto;

    return this.prisma.orderItem.create({
      data: {
        orderId,
        menuProductId,
        productName,
        productDescription,
        productImageUrl,
        quantity,
        priceAtPurchase: new Prisma.Decimal(priceAtPurchase),
        notes,
      },
    });
  }

  async findAll() {
    return this.prisma.orderItem.findMany();
  }

  async findOne(id: string) {
    return this.prisma.orderItem.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateOrderItemDto) {
    return this.prisma.orderItem.update({
      where: { id },
      data: {
        ...dto,
        priceAtPurchase: dto.priceAtPurchase
          ? new Prisma.Decimal(dto.priceAtPurchase)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.orderItem.delete({ where: { id } });
  }
}
