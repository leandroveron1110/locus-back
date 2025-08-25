import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Order,
  OrderOrigin,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
} from '../dtos/request/order.dto';
import { OrderGateway } from './socket/order-gateway';
import { OrderResponseDtoMapper } from '../dtos/response/order-response.dto';
import {
  IOrderService,
  IOrderValidationService,
} from '../interfaces/order-service.interface';
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

      const createdOrder = await tx.order.create({
        data: {
          ...baseOrderData,
          pickupAddressId: pickupAddress?.id,
          deliveryAddressId: deliveryAddress?.id,
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
      // user: true,
      // deliveryAddress: true,
      // pickupAddress: true,
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

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<Order> {
    try {
      // 1. Validar la existencia y estado actual de la orden
      const currentOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      const validInitialStates: PaymentStatus[] = [
        PaymentStatus.PENDING,
        PaymentStatus.IN_PROGRESS,
      ];
      if (!validInitialStates.includes(currentOrder.paymentStatus)) {
        throw new BadRequestException(
          `Cannot change payment status of an order that is already ${currentOrder.paymentStatus}.`,
        );
      }

      // 2. Determinar el nuevo estado de la orden en base al estado de pago
      let newOrderStatus: OrderStatus;
      switch (paymentStatus) {
        case PaymentStatus.CONFIRMED:
          newOrderStatus = OrderStatus.CONFIRMED;
          break;
        case PaymentStatus.REJECTED:
          newOrderStatus = OrderStatus.REJECTED_BY_BUSINESS;
          break;
        default:
          // Si el estado de pago es IN_PROGRESS o PENDING, el estado de la orden no cambia
          newOrderStatus = currentOrder.status;
          break;
      }

      // 3. Actualizar la orden de forma atómica
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: paymentStatus,
          status: newOrderStatus,
        },
      });

      // 4. Emitir el evento de Socket con los nuevos estados
      this.orderGateway.emitOrderStatusUpdated(
        updatedOrder.id,
        updatedOrder.status,
        updatedOrder.userId,
        updatedOrder.businessId,
        updatedOrder.deliveryCompanyId,
      );

      this.orderGateway.emitPaymentUpdated(
        updatedOrder.id,
        updatedOrder.paymentStatus,
        updatedOrder.paymentReceiptUrl || '',
        updatedOrder.userId,
        updatedOrder.businessId,
      );

      return updatedOrder;
    } catch (error) {
      // Relanzar el error o devolver un mensaje amigable
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error processing payment status update.',
      );
    }
  }

  async updatePayment(
    orderId: string,
    data: {
      paymentType?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // Validaciones básicas
    if (
      data.paymentType === PaymentMethodType.TRANSFER &&
      !data.paymentHolderName &&
      !data.paymentReceiptUrl
    ) {
      throw new BadRequestException(
        'El nombre del titular es obligatorio para transferencias',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentType: data.paymentType ?? order.paymentType,
        paymentStatus: data.paymentStatus ?? order.paymentStatus,
        paymentReceiptUrl: data.paymentReceiptUrl ?? order.paymentReceiptUrl,
        paymentInstructions:
          data.paymentInstructions ?? order.paymentInstructions,
        paymentHolderName: data.paymentHolderName ?? order.paymentHolderName,
      },
    });

    // Emitir evento a sockets si quieres notificar al negocio en tiempo real
    // 🚨 CAMBIO IMPORTANTE: Ahora emite el evento específico de pago 🚨
    this.orderGateway.emitPaymentUpdated(
      updatedOrder.id,
      updatedOrder.paymentStatus,
      data.paymentReceiptUrl || '',
      updatedOrder.userId,
      updatedOrder.businessId,
    );

    return updatedOrder;
  }

  async remove(id: string): Promise<Order> {
    return this.prisma.order.delete({ where: { id } });
  }
}
