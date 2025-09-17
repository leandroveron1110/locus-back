import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { validateWithZod } from 'src/common/validators/validate-with-zod';
import {
  CreateOrderFullDTO,
  CreateOrderSchema,
  UpdateOrderDTO,
  UpdateOrderSchema,
} from '../dtos/request/order.dto';
import { Order, OrderStatus, PaymentMethodType, PaymentStatus } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IOrderService } from '../interfaces/order-service.interface';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { OrderPermissions } from 'src/common/enums/rolees-permissions';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(TOKENS.IOrderService)
    private readonly ordersService: IOrderService,
  ) {}

  @Post()
  // Un empleado del negocio crea un pedido de forma manual
  @Permissions(OrderPermissions.CREATE_ORDER)
  create(@Body() createOrderDto: any) {
    const validated = validateWithZod(CreateOrderSchema, createOrderDto);
    return this.ordersService.create(validated);
  }

  @Post('full')
  // Un cliente crea un pedido. No necesita permisos de negocio.
  @Public()
  async createFullOrder(@Body() dto: CreateOrderFullDTO) {
    return this.ordersService.createFullOrder(dto);
  }

  @Get()
  // Un empleado del negocio ve la lista completa de pedidos
  @Permissions(OrderPermissions.VIEW_ORDERS)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  // Un empleado del negocio ve los detalles de un pedido
  @Permissions(OrderPermissions.VIEW_ORDERS)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('business/:businessId')
  // Un empleado ve los pedidos de su negocio
  @Permissions(OrderPermissions.VIEW_ORDERS)
  async getOrdersByBusiness(@Param('businessId') businessId: string) {
    return this.ordersService.findOrdersByBusiness(businessId);
  }

  @Get('user/:userId')
  // Un cliente puede ver sus propios pedidos
  @Public()
  async getOrdersByUserId(@Param('userId') userId: string) {
    return this.ordersService.findOrdersByUserId(userId);
  }

  @Get('delivery/:deliveryId')
  // Un repartidor puede ver sus pedidos asignados. Se asume que el servicio valida la pertenencia.
  @Public()
  async findOrdersByDeliveyId(@Param('deliveryId') deliveryId: string) {
    return this.ordersService.findOrdersByDeliveyId(deliveryId);
  }

  @Patch('/order/stauts/:id')
  // Un empleado puede cambiar el estado de un pedido (ej. a "en preparación" o "entregado")
  @Permissions(OrderPermissions.PROCESS_ORDER)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch('/order/payment/stauts/:id')
  // Un cliente puede actualizar su pago. El negocio también puede.
  @Public()
  async updatePayment(
    @Param('id') id: string,
    @Body('status')
    status: {
      paymentType?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<Order> {
    return this.ordersService.updatePayment(id, status);
  }

  @Patch('/order/payment-status/stauts/:id')
  // Similar al anterior, accesible para clientes y empleados
  @Public()
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status')
    status: PaymentStatus,
  ): Promise<Order> {
    return this.ordersService.updatePaymentStatus(id, status);
  }

  @Patch(':id')
  // Un empleado puede editar un pedido existente
  @Permissions(OrderPermissions.EDIT_ORDER)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDTO) {
    const validated = validateWithZod(UpdateOrderSchema, updateOrderDto);
    return this.ordersService.update(id, validated);
  }

  @Delete(':id')
  // Un empleado puede cancelar un pedido
  @Permissions(OrderPermissions.CANCEL_ORDER)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}