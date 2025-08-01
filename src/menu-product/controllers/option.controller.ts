// src/option/option.controller.ts
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { OptionService } from '../services/option.service';
import { CreateOpcionDto } from '../dtos/request/opcion-request.dto';


@Controller('options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  async create(@Body() dto: CreateOpcionDto) {
    return await this.optionService.create(dto);
  }

  @Get('group/:groupId')
  findAllByGroup(@Param('groupId') groupId: string) {
    return this.optionService.findAllByGroup(groupId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.optionService.delete(id);
  }
}
