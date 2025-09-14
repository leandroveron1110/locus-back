// src/delivery/delivery.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  Inject,
} from '@nestjs/common';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from '../dtos/request/delivery-company.dto';
import { UpdateOrderStatusDto } from '../dtos/request/update-order-status.dto';
import { IDeliveryService } from '../interfaces/delivery-service.interface';
import { TOKENS } from 'src/common/constants/tokens';

@Controller('delivery')
export class DeliveryController {
  constructor(
    @Inject(TOKENS.IDeliveryService)
    private readonly deliveryService: IDeliveryService
  ) {}

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
  async findManyCompanyByOwnerId(@Param('ownerId') ownerId: string) {
    const res = await this.deliveryService.findManyCompanyByOwnerId(ownerId);
    return res; 
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
