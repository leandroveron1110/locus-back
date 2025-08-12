import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderOrigin, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
} from '../dtos/request/order.dto';
import { OrderGateway } from './socket/order-gateway';
import { OrderResponseDtoMapper } from '../dtos/response/order-response.dto';
import { IOrderService, IOrderValidationService } from '../interfaces/order-service.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IOrderGateway } from '../interfaces/order-gateway.interface';

@Injectable()
export class OrderService implements IOrderService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IOrderValidationService)
    private orderValidation: IOrderValidationService,
    @Inject(TOKENS.IOrderGateway)
    private readonly orderGateway: IOrderGateway,
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

      let pickupAddressId = await this.validateAndGetPickupAddressId(tx, pickupAddress, dto.userId);

      // Para deliveryAddress queda comentado, si se activa, crear función similar para validación

      const createdOrder = await tx.order.create({
        data: {
          ...baseOrderData,
          pickupAddressId,
          deliveryAddressId: undefined,
          origin: OrderOrigin.WEB,
        },
      });

      for (const item of items) {
        const createdItem = await tx.orderItem.create({
          data: { ...item, orderId: createdOrder.id, optionGroups: undefined },
        });

        for (const group of item.optionGroups) {
          const createdGroup = await tx.orderOptionGroup.create({
            data: { ...group, orderItemId: createdItem.id, options: undefined },
          });

          for (const option of group.options) {
            await tx.orderOption.create({
              data: { ...option, orderOptionGroupId: createdGroup.id },
            });
          }
        }
      }

      return createdOrder;
    });

    const fullOrder = await this.findOne(order.id);
    this.orderGateway.emitNewOrder(fullOrder);

    return order;
  }

  private async validateAndGetPickupAddressId(tx: any, pickupAddress: any, userId: string): Promise<string | undefined> {
    if (!pickupAddress || !('id' in pickupAddress)) return undefined;

    const found = await tx.address.findUnique({ where: { id: pickupAddress.id } });
    if (!found || found.userId !== userId) {
      throw new Error('Pickup address inválida o no pertenece al usuario');
    }
    return pickupAddress.id;
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.findOrderWithIncludes(id);
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return OrderResponseDtoMapper.fromPrisma(order);
  }

  async findOrdersByBusiness(businessId: string) {
    return this.findOrdersWithIncludes({ businessId });
  }

  async findOrdersByUserId(userId: string) {
    return this.findOrdersWithIncludes({ userId });
  }

  async findOrdersByDeliveyId(deliveryId: string) {
    return this.findOrdersWithIncludes({ deliveryCompanyId: deliveryId });
  }

  private async findOrderWithIncludes(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: this.commonIncludes,
    });
  }

  private async findOrdersWithIncludes(where: object) {
    const orders = await this.prisma.order.findMany({
      where,
      include: this.commonIncludes,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(OrderResponseDtoMapper.fromPrisma);
  }

  private get commonIncludes() {
    return {
      user: true,
      deliveryAddress: true,
      pickupAddress: true,
      OrderItem: {
        include: {
          optionGroups: { include: { options: true } },
        },
      },
      OrderDiscount: true,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDTO): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    this.orderGateway.emitOrderStatusUpdated(
      updatedOrder.id,
      updatedOrder.status,
      updatedOrder.userId,
      updatedOrder.businessId,
      updatedOrder.deliveryCompanyId,
    );

    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    return this.prisma.order.delete({ where: { id } });
  }
}
