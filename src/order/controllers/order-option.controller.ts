import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { OrderOptionService } from '../services/order-option.service';
import { CreateOrderOptionDto, UpdateOrderOptionDto } from '../dtos/request/order-option.dto';

@Controller('order-options')
export class OrderOptionController {
  constructor(private readonly service: OrderOptionService) {}

  @Post()
  create(@Body() dto: CreateOrderOptionDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateOrderOptionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
