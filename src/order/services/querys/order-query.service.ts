import { Injectable, NotFoundException } from '@nestjs/common';
import NewDate from 'src/common/validators/date';
import { OrderResponseDtoMapper } from 'src/order/dtos/response/order-response.dto';
import { IOrderQueryService } from 'src/order/interfaces/order-service.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderQueryService implements IOrderQueryService {
  constructor(private prisma: PrismaService) {}
  async findOrdersByDeliveyId(deliveryId: string) {
    return this.findOrdersWithIncludes({ deliveryCompanyId: deliveryId });
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return orders;
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.commonIncludes,
    });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return OrderResponseDtoMapper.fromPrisma(order);
  }

  async findOrdersByBusiness(businessId: string) {
    return this.findOrdersWithIncludes({ businessId });
  }

  async findOrdersByUserId(userId: string) {
    return this.findOrdersWithIncludes({ userId });
  }

  async findOrdersByDeliveryId(deliveryCompanyId: string) {
    return this.findOrdersWithIncludes({ deliveryCompanyId });
  }

  private async findOrdersWithIncludes(where: object, lastHours = 24) {
    const dateFilter = { gte: new Date(NewDate().getTime() - lastHours * 60 * 60 * 1000) };

    const orders = await this.prisma.order.findMany({
      where: {
        ...where,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      include: this.commonIncludes,
      orderBy: { createdAt: 'desc' },
    });

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
