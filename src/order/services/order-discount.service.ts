import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOrderDiscountDto } from "../dtos/request/order-discount.dto";

@Injectable()
export class OrderDiscountService {
  constructor(private prisma: PrismaService) {}

  async createMany(orderDiscounts: CreateOrderDiscountDto[], orderId: string, tx: Prisma.TransactionClient) {
    const data = orderDiscounts.map(discount => ({
      ...discount,
      orderId,
    }));
    return tx.orderDiscount.createMany({ data });
  }
}