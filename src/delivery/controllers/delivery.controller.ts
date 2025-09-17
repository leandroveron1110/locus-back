import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from '../dtos/request/delivery-company.dto';
import { UpdateOrderStatusDto } from '../dtos/request/update-order-status.dto';
import { IDeliveryService } from '../interfaces/delivery-service.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('delivery')
export class DeliveryController {
  constructor(
    @Inject(TOKENS.IDeliveryService)
    private readonly deliveryService: IDeliveryService,
  ) {}

  // --- CRUD compañías ---
  
  @Post('companies')
  // Solo los dueños de negocios o administradores pueden gestionar compañías de delivery
  @Roles(UserRole.OWNER)
  create(@Body() dto: CreateDeliveryCompanyDto) {
    return this.deliveryService.createCompany(dto);
  }

  @Get('companies')
  // Las compañías de delivery son información pública
  @Public()
  findAll() {
    return this.deliveryService.findAllCompanies();
  }

  @Get('companies/:id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOneCompany(id);
  }

  @Get('companies/owner/:ownerId')
  // Los dueños pueden ver las compañías que les pertenecen
  @Roles(UserRole.OWNER)
  async findManyCompanyByOwnerId(@Param('ownerId') ownerId: string) {
    const res = await this.deliveryService.findManyCompanyByOwnerId(ownerId);
    return res;
  }

  @Patch('companies/:id')
  // Solo los dueños o administradores pueden actualizar la info de compañías
  @Roles(UserRole.OWNER)
  // @Permissions(PermissionsEnum.MANAGE_DELIVERY_ZONES)
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryCompanyDto) {
    return this.deliveryService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  // Solo los dueños o administradores pueden eliminar compañías de delivery
  @Roles(UserRole.OWNER)
  // @Permissions(PermissionsEnum.MANAGE_DELIVERY_ZONES)
  remove(@Param('id') id: string) {
    return this.deliveryService.deleteCompany(id);
  }

  // --- Asignar compañía a orden ---
  
  @Post('orders/:orderId/assign-company/:deliveryId')
  // Solo aquellos con el permiso adecuado pueden asignar un repartidor a una orden
  // @Permissions(PermissionsEnum.DELIVER_ORDER)
  assignCompany(
    @Param('orderId') orderId: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.assignCompanyToOrder(orderId, deliveryId);
  }

  // --- Actualizar estado de orden ---
  
  @Patch('orders/:orderId/status')
  // Este endpoint es usado por las compañías de delivery para notificar estados, por lo que debe ser público y la lógica de validación se manejará internamente en el servicio
  @Public()
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.deliveryService.updateOrderStatus(orderId, dto.status);
  }
}