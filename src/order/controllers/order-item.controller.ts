import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { OrderItemService } from '../services/order-item.service';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dtos/request/order-item.dto';

@Controller('order-items')
export class OrderItemController {
  constructor(private readonly service: OrderItemService) {}

  @Post()
  create(@Body() dto: CreateOrderItemDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
