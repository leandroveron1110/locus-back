import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { validateWithZod } from 'src/common/validators/validate-with-zod';
import {
  CreateOrderFullDTO,
  CreateOrderSchema,
  UpdateOrderDTO,
  UpdateOrderSchema,
} from '../dtos/request/order.dto';
import {
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  IOrderCreationService,
  IOrderQueryService,
  IOrderUpdateService,
  IOrderDeleteService,
} from '../interfaces/order-service.interface';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';
import { OrderPermissions, ProductPermissions } from 'src/common/enums/rolees-permissions';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(TOKENS.IOrderCreationService)
    private readonly orderCreationService: IOrderCreationService,

    @Inject(TOKENS.IOrderQueryService)
    private readonly orderQueryService: IOrderQueryService,

    @Inject(TOKENS.IOrderUpdateService)
    private readonly orderUpdateService: IOrderUpdateService,

    @Inject(TOKENS.IOrderDeleteService)
    private readonly orderDeleteService: IOrderDeleteService,
  ) {}

  // ================== CREACIÓN ==================

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() createOrderDto: any) {
    const validated = validateWithZod(CreateOrderSchema, createOrderDto);
    return this.orderCreationService.create(validated);
  }

  @Post('full')
  @Public()
  @HttpCode(HttpStatus.CREATED) // Opcional, pero recomendado
  async createFullOrder(
    @Body() dto: CreateOrderFullDTO,
  ): Promise<{ id: string }> {
    const order = await this.orderCreationService.createFullOrder(dto);
    return { id: order.id };
  }

  // ================== CONSULTAS ==================

  @Get()
  @Roles(UserRole.OWNER)
  findAll() {
    return this.orderQueryService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.orderQueryService.findOne(id);
  }

  @Get('business/:businessId')
  @Roles(UserRole.OWNER)
  @Permissions(OrderPermissions.VIEW_ORDERS, ProductPermissions.EDIT_PRODUCT)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  getOrdersByBusiness(@Param('businessId') businessId: string) {
    return this.orderQueryService.findOrdersByBusiness(businessId);
  }

  @Get('user/:userId')
  @Public()
  getOrdersByUserId(@Param('userId') userId: string) {
    return this.orderQueryService.findOrdersByUserId(userId);
  }

  @Get('delivery/:deliveryId')
  @Public()
  findOrdersByDeliveyId(@Param('deliveryId') deliveryId: string) {
    return this.orderQueryService.findOrdersByDeliveyId(deliveryId);
  }

  // ================== ACTUALIZACIONES ==================

  @Patch('/order/status/:id')
  @Roles(UserRole.OWNER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ): Promise<OrderStatus> {
    return this.orderUpdateService.updateStatus(id, status);
  }

  @Patch('/order/payment/status/:id')
  @Public()
  updatePayment(
    @Param('id') id: string,
    @Body('status')
    status: {
      paymentType?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<PaymentMethodType> {
    return this.orderUpdateService.updatePayment(id, status);
  }

  @Patch('/order/payment-status/status/:id')
  @Public()
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ): Promise<PaymentStatus> {
    return this.orderUpdateService.updatePaymentStatus(id, status);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDTO) {
    const validated = validateWithZod(UpdateOrderSchema, updateOrderDto);
    return this.orderUpdateService.update(id, validated);
  }

  // ================== ELIMINACIÓN ==================

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.orderDeleteService.remove(id);
  }
}
