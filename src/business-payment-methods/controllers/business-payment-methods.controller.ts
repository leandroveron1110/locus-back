// src/business-payment-methods/business-payment-methods.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BusinessPaymentMethodsService } from '../services/business-payment-methods.service';
import { CreateBusinessPaymentMethodDto } from '../dtos/request/create-business-payment-method.dto';
import { UpdateBusinessPaymentMethodDto } from '../dtos/request/update-business-payment-method.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('business-payment-methods')
export class BusinessPaymentMethodsController {
  constructor(private readonly service: BusinessPaymentMethodsService) {}

  @Post()
  create(@Body() createDto: CreateBusinessPaymentMethodDto) {
    return this.service.create(createDto);
  }

  @Get('business/:businessId')
  @Roles(UserRole.CLIENT)
  findAllByBusiness(@Param('businessId') businessId: string) {
    return this.service.findAllByBusiness(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessPaymentMethodDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}