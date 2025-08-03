import { Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderOrigin, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderDto,
  CreateOrderFullDto,
  UpdateOrderDto,
} from '../dtos/request/order.dto';
import { OrderValidationService } from './validations/order-validation.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private orderValidation: OrderValidationService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.prisma.order.create({
      data: {
        ...createOrderDto,
        total: new Prisma.Decimal(createOrderDto.total),
        status: OrderStatus.PENDING,
        origin: OrderOrigin.WEB,
      },
    });
  }

  async createFullOrder(dto: CreateOrderFullDto): Promise<Order> {
    await this.orderValidation.validateCreateFullOrder(dto);

    return this.prisma.$transaction(async (tx) => {
      const { items, ...orderData } = dto;

      const order = await tx.order.create({ data: {...orderData, origin: 'WEB'} });

      for (const item of items) {
        const { optionGroups, ...itemData } = item;

        const createdItem = await tx.orderItem.create({
          data: {
            ...itemData,
            orderId: order.id,
          },
        });

        for (const group of optionGroups) {
          const { options, ...groupData } = group;

          const createdGroup = await tx.orderOptionGroup.create({
            data: {
              ...groupData,
              orderItemId: createdItem.id,
            },
          });

          for (const option of options) {
            await tx.orderOption.create({
              data: {
                ...option,
                orderOptionGroupId: createdGroup.id,
              },
            });
          }
        }
      }

      return order;
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        business: true,
        deliveryAddress: true,
        pickupAddress: true,
        OrderItem: true,
        OrderDiscount: true,
        DeliveryCompany: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async remove(id: string): Promise<Order> {
    return this.prisma.order.delete({
      where: { id },
    });
  }
}
