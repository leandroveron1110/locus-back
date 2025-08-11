// src/delivery/delivery.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { DeliveryService } from '../services/delivery.service';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from '../dtos/request/delivery-company.dto';
import { AssignCompanyDto } from '../dtos/request/assign-company.dto';
import { UpdateOrderStatusDto } from '../dtos/request/update-order-status.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // --- CRUD compañías ---
  @Post('companies')
  create(@Body() dto: CreateDeliveryCompanyDto) {
    return this.deliveryService.createCompany(dto);
  }

  @Get('companies')
  findAll() {
    return this.deliveryService.findAllCompanies();
  }

  @Get('companies/:id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOneCompany(id);
  }

  @Get('companies/owner/:ownerId')
  findManyCompanyByOwnerId(@Param('ownerId') ownerId: string) {
    return this.deliveryService.findManyCompanyByOwnerId(ownerId);
  }

  @Patch('companies/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryCompanyDto) {
    return this.deliveryService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  remove(@Param('id') id: string) {
    return this.deliveryService.deleteCompany(id);
  }

  // --- Asignar compañía a orden ---
  @Post('orders/:orderId/assign-company/:deliveryId')
  assignCompany(
    @Param('orderId') orderId: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.assignCompanyToOrder(orderId, deliveryId);
  }

  // --- Actualizar estado de orden ---
  @Patch('orders/:orderId/status')
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.deliveryService.updateOrderStatus(orderId, dto.status);
  }
}
