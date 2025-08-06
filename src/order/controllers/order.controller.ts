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
import { CreateOrderFullDTO, CreateOrderSchema, UpdateOrderDTO, UpdateOrderSchema } from '../dtos/request/order.dto';

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
