import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { OptionGroupService } from '../services/option-group.service';
import { CreateOptionGroupDto, UpdateOptionGroupDto } from '../dtos/request/option-group-request.dto';

@Controller('option-groups')
export class OptionGroupController {
  constructor(private readonly service: OptionGroupService) {}

  @Post()
  create(@Body() dto: CreateOptionGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('menu-product/:menuProductId')
  findByMenuProduct(@Param('menuProductId') menuProductId: string) {
    return this.service.findByMenuProduct(menuProductId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOptionGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
