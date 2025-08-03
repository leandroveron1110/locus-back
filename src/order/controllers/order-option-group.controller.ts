import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { OrderOptionGroupService } from '../services/order-option-group.service';
import { CreateOrderOptionGroupDto, UpdateOrderOptionGroupDto } from '../dtos/request/order-option-group.dto';

@Controller('order-option-groups')
export class OrderOptionGroupController {
  constructor(private readonly service: OrderOptionGroupService) {}

  @Post()
  create(@Body() dto: CreateOrderOptionGroupDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateOrderOptionGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
