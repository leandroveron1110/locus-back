import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { OptionGroupService } from '../services/option-group.service';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
} from '../dtos/request/option-group-request.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('option-groups')
export class OptionGroupController {
  constructor(private readonly service: OptionGroupService) {}

  @Post()
  @Roles(UserRole.OWNER)
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
  @Roles(UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  async update(@Param('id') id: string, @Body() dto: Partial<UpdateOptionGroupDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
