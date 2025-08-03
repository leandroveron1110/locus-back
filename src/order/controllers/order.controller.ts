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
import {
  CreateOrderDto,
  CreateOrderFullDto,
  UpdateOrderDto,
} from '../dtos/request/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly ordersService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Post('full')
  async createFullOrder(@Body() dto: CreateOrderFullDto) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
