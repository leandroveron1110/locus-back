import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { validateWithZod } from 'src/common/validators/validate-with-zod';
import {
  CreateOrderFullDTO,
  CreateOrderSchema,
  UpdateOrderDTO,
  UpdateOrderSchema,
} from '../dtos/request/order.dto';
import { Order, OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly ordersService: OrderService) {}

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
