import { Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderOrigin, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { OrderValidationService } from './validations/order-validation.service';
import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
} from '../dtos/request/order.dto';
import { OrderPreviewDto } from '../dtos/response/order-preview.dto';

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

  async createFullOrder(dto: CreateOrderFullDTO): Promise<Order> {
    await this.orderValidation.validateCreateFullOrder(dto);

    return this.prisma.$transaction(async (tx) => {
      const { items, pickupAddress, deliveryAddress, ...baseOrderData } = dto;

      // Procesar pickupAddress
      let pickupAddressId: string | undefined;
      if (pickupAddress) {
        if ('id' in pickupAddress) {
          // Verificar que la dirección existe y es del usuario
          console.log(pickupAddress.id);
          const found = await tx.address.findUnique({
            where: { id: pickupAddress.id },
          });
          if (!found || found.userId !== dto.userId) {
            throw new Error(
              'Pickup address inválida o no pertenece al usuario',
            );
          }
          pickupAddressId = pickupAddress.id;
        } else {
          // Crear nueva dirección
          const created = await tx.address.create({
            data: {
              ...pickupAddress,
              userId: dto.userId,
            },
          });
          pickupAddressId = created.id;
        }
      }

      // Procesar deliveryAddress
      let deliveryAddressId: string | undefined;
      if (deliveryAddress) {
        if ('id' in deliveryAddress) {
          const found = await tx.address.findUnique({
            where: { id: deliveryAddress.id },
          });
          if (!found || found.businessId !== dto.businessId) {
            throw new Error(
              'Delivery address inválida o no pertenece al business',
            );
          }
          deliveryAddressId = deliveryAddress.id;
        }
      }

      const order = await tx.order.create({
        data: {
          ...baseOrderData,
          pickupAddressId,
          deliveryAddressId,
          origin: OrderOrigin.WEB,
        },
      });

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

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        deliveryAddress: true,
        pickupAddress: true,
        OrderItem: {
          include: {
            optionGroups: {
              include: {
                options: true,
              },
            },
          },
        },
        OrderDiscount: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    console.log(order.OrderItem[0].optionGroups[0].options)
    return OrderPreviewDto.fromPrisma(order);
  }

  // order.service.ts
  async findOrdersByBusiness(businessId: string) {
    const orders = await this.prisma.order.findMany({
      where: { businessId },
      include: {
        user: true,
        deliveryAddress: true,
        pickupAddress: true,
        OrderItem: {
          include: {
            optionGroups: {
              include: {
                options: true,
              },
            },
          },
        },
        OrderDiscount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => OrderPreviewDto.fromPrisma(order));
  }

  async update(id: string, updateOrderDto: UpdateOrderDTO): Promise<Order> {
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
