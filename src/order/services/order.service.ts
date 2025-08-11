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
import { OrderGateway } from './socket/order-gateway';
import { OrderResponseDtoMapper } from '../dtos/response/order-response.dto';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private orderValidation: OrderValidationService,
    private readonly orderGateway: OrderGateway, // 👈 nuevo
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

    const order = await this.prisma.$transaction(async (tx) => {
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
        }
      }

      // Procesar deliveryAddress
      let deliveryAddressId: string | undefined;
      // if (deliveryAddress) {
      //   if ('id' in deliveryAddress) {
      //     const found = await tx.address.findMany({
      //       where: { businessId: dto.businessId },
      //     });
      //     if (
      //       !found ||
      //       (found.length > 0 && found[0].businessId !== dto.businessId)
      //     ) {
      //       throw new Error(
      //         'Delivery address inválida o no pertenece al business',
      //       );
      //     }
      //     deliveryAddressId = deliveryAddress.id;
      //   }
      // }

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

    const orders = await this.findOne(order.id);

    // Usar el nuevo método del gateway
    this.orderGateway.emitNewOrder(orders);

    return order;
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
    return OrderResponseDtoMapper.fromPrisma(order);
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

    return orders.map((order) => OrderResponseDtoMapper.fromPrisma(order));
  }
  async findOrdersByUserId(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
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

    return orders.map((order) => OrderResponseDtoMapper.fromPrisma(order));
  }

  async findOrdersByDeliveyId(deliveryId: string) {
    const orders = await this.prisma.order.findMany({
      where: { deliveryCompanyId: deliveryId },
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

    return orders.map((order) => OrderResponseDtoMapper.fromPrisma(order));
  }

  async update(id: string, updateOrderDto: UpdateOrderDTO): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });

    // this.orderGateway.server
    //   .to(`order-${id}`)
    //   .emit('order_updated', updatedOrder);

    // // Si pasa a estado 'DELIVERY', notificar a todos los repartidores
    // if (updateOrderDto.status === OrderStatus.DELIVERED) {
    //   this.orderGateway.server.to('delivery').emit('order_ready', updatedOrder);
    // }

    return updatedOrder;
  }

  async updateStatus(
    id: string,
    updateOrderStatus: OrderStatus,
  ): Promise<Order> {
    // Actualizamos y recuperamos datos necesarios
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: updateOrderStatus },
    });

    // Emitimos a las salas correctas
    this.orderGateway.emitOrderStatusUpdated(
      updatedOrder.id,
      updatedOrder.status,
      updatedOrder.userId,
      updatedOrder.businessId,
      updatedOrder.deliveryCompanyId, // <- importante
    );

    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    return this.prisma.order.delete({
      where: { id },
    });
  }
}
