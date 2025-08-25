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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BusinessPaymentMethodsService } from '../services/business-payment-methods.service';
import { CreateBusinessPaymentMethodDto } from '../dtos/request/create-business-payment-method.dto';
import { UpdateBusinessPaymentMethodDto } from '../dtos/request/update-business-payment-method.dto';

@ApiTags('business-payment-methods')
@Controller('business-payment-methods')
export class BusinessPaymentMethodsController {
  constructor(private readonly service: BusinessPaymentMethodsService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo método de pago para un negocio' })
  create(@Body() createDto: CreateBusinessPaymentMethodDto) {
    return this.service.create(createDto);
  }

  @Get('business/:businessId')
  findAllByBusiness(@Param('businessId') businessId: string) {
    return this.service.findAllByBusiness(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un método de pago existente' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBusinessPaymentMethodDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un método de pago' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}