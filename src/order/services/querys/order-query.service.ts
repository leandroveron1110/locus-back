import { Injectable, NotFoundException } from '@nestjs/common';
import NewDate from 'src/common/validators/date';
import { LoggingService } from 'src/logging/logging.service';
import { OrderResponseDtoMapper } from 'src/order/dtos/response/order-response.dto';
import { IOrderQueryService } from 'src/order/interfaces/order-service.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderQueryService implements IOrderQueryService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggingService
  ) {
    this.logger.setContext(OrderQueryService.name);
    this.logger.setService("OrderModule");
  }

  async findOrdersByDeliveyId(deliveryId: string) {
    this.logger.debug("Fetching orders by deliveryId", { deliveryId });
    return this.findOrdersWithIncludes({ deliveryCompanyId: deliveryId });
  }

  async findAll() {
    this.logger.debug("Fetching all orders");
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`Fetched ${orders.length} orders`);
    return orders;
  }

  async checkOne(orderId: string): Promise<void> {
    const exists = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
  }

  async findOne(id: string) {
    this.logger.debug("Fetching single order", { orderId: id });
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.commonIncludes,
    });
    if (!order) {
      this.logger.warn("Order not found", { orderId: id });
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    this.logger.log("Order found", { orderId: id });
    return OrderResponseDtoMapper.fromPrisma(order);
  }

  async findOrdersByBusiness(businessId: string) {
    this.logger.debug("Fetching orders by business", { businessId });
    return this.findOrdersWithIncludes({ businessId });
  }

  async findOrdersByUserId(userId: string) {
    this.logger.debug("Fetching orders by user", { userId });
    return this.findOrdersWithIncludes({ userId });
  }

  async findOrdersByDeliveryId(deliveryCompanyId: string) {
    this.logger.debug("Fetching orders by delivery company", { deliveryCompanyId });
    return this.findOrdersWithIncludes({ deliveryCompanyId });
  }

  private async findOrdersWithIncludes(where: object, lastHours = 24) {
    const dateFilter = {
      gte: new Date(NewDate().getTime() - lastHours * 60 * 60 * 1000),
    };

    this.logger.debug("Building query for orders", { where, dateFilter });

    const orders = await this.prisma.order.findMany({
      where: {
        ...where,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: this.commonIncludes,
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Fetched ${orders.length} orders with includes`, { where });
    return orders.map(OrderResponseDtoMapper.fromPrisma);
  }

  private get commonIncludes() {
    return {
      OrderItem: {
        include: { optionGroups: { include: { options: true } } },
      },
      OrderDiscount: true,
    };
  }
}
