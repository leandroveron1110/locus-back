import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Inject,
} from '@nestjs/common';
import { validateWithZod } from 'src/common/validators/validate-with-zod';
import {
  CreateOrderFullDTO,
  CreateOrderSchema,
  UpdateOrderDTO,
  UpdateOrderSchema,
} from '../dtos/request/order.dto';
import {
  Order,
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
} from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IOrderService } from '../interfaces/order-service.interface';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(TOKENS.IOrderService)
    private readonly ordersService: IOrderService,
  ) {}

  @Post()
  create(@Body() createOrderDto: any) {
    const validated = validateWithZod(CreateOrderSchema, createOrderDto);
    return this.ordersService.create(validated);
  }

  @Post('full')
  async createFullOrder(@Body() dto: CreateOrderFullDTO) {
    return this.ordersService.createFullOrder(dto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('business/:businessId')
  async getOrdersByBusiness(@Param('businessId') businessId: string) {
    return this.ordersService.findOrdersByBusiness(businessId);
  }

  @Get('user/:userId')
  async getOrdersByUserId(@Param('userId') userId: string) {
    return this.ordersService.findOrdersByUserId(userId);
  }
  @Get('delivery/:deliveryId')
  async findOrdersByDeliveyId(@Param('deliveryId') deliveryId: string) {
    return this.ordersService.findOrdersByDeliveyId(deliveryId);
  }
  @Patch('/order/stauts/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch('/order/payment/stauts/:id')
  async updatePayment(
    @Param('id') id: string,
    @Body('status')
    status: {
      paymentType?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<Order> {
    return this.ordersService.updatePayment(id, status);
  }

  @Patch('/order/payment-status/stauts/:id')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status')
    status: PaymentStatus,
  ): Promise<Order> {
    return this.ordersService.updatePaymentStatus(id, status);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDTO) {
    const validated = validateWithZod(UpdateOrderSchema, updateOrderDto);
    return this.ordersService.update(id, validated);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
