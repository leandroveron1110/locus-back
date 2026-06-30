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
  SyncBusinessOrderDTO,
} from '../dtos/request/order.dto';
import {
  DeliveryStatus,
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
import {
  OrderPermissions,
  ProductPermissions,
} from 'src/common/enums/rolees-permissions';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SyncResult } from '../services/querys/order-query.service';
import {
  SyncNotificationResponse,
  SyncNotificationUserResponse,
} from '../dtos/response/sync-notification-orders.dto.';
import { OrdersSyncService } from '../services/commands/orders-sync.service';
import { SyncOrderEventsDto } from '../dtos/request/sync-order-events.dto';

export class SyncOrdersDto {
  @IsNotEmpty({ message: 'El id no puede estar vacío.' })
  @IsString({ message: 'El id debe ser una cadena de texto válida.' })
  public id: string;

  @IsOptional()
  public hours: number;

  // 💡 Opcional: El frontend lo enviará solo si ya tiene una marca de tiempo
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'lastSyncTime debe ser un ISO 8601 válido.' },
  )
  public lastSyncTime?: string;
}

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

    private readonly syncService: OrdersSyncService,
  ) {}

  // ================== CREACIÓN ==================

  @Post('full-sync')
  @Public()
  @HttpCode(HttpStatus.CREATED) // Opcional, pero recomendado
  async createOrder(@Body() dto: CreateOrderFullDTO): Promise<{ id: string }> {
    const order = await this.orderCreationService.build(dto);
    return { id: order.id };
  }

  @Post('sync-from-pos')
  @Public()
  @HttpCode(HttpStatus.CREATED) // Opcional, pero recomendado
  async syncFromPos(
    @Body() dto: SyncBusinessOrderDTO,
  ): Promise<{ id: string }> {
    const result = await this.orderCreationService.syncOrderFromBusiness(dto);
    return { id: result.id };
  }

  @Post('sync-batch')
  @Public()
  @HttpCode(HttpStatus.CREATED) // Opcional, pero recomendado
  async syncBatchOrdersFromBusiness(
    @Body() dto: { businessId: string; orders: SyncBusinessOrderDTO[] },
  ) {
    const result =
      await this.orderCreationService.syncBatchOrdersFromBusiness(dto);
    return result;
  }

  // @Post('events/sync')
  // @Public()
  // @HttpCode(HttpStatus.CREATED)
  // async syncEvents(@Body() dto: SyncOrderEventsDto) {
  //   return await this.syncService.syncHistoryEvents(dto);
  // }

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

  @Post('sync/business')
  @HttpCode(200)
  @Roles(UserRole.OWNER)
  @Permissions(OrderPermissions.VIEW_ORDERS, ProductPermissions.EDIT_PRODUCT)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async syncOrders(
    @Body()
    body: {
      id: string;
      lastSyncTime?: string;
      daysBack?: number;
      specificDate?: string;
    },
  ) {
    const { id, lastSyncTime, daysBack, specificDate } = body;
    return this.orderQueryService.syncOrdersByBusinessId(id, 200, lastSyncTime);
  }

  @Post('sync/user')
  @HttpCode(200)
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  @Permissions(OrderPermissions.VIEW_ORDERS, ProductPermissions.EDIT_PRODUCT)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async syncOrdersUser(@Body() body: SyncOrdersDto): Promise<SyncResult> {
    const { id, lastSyncTime, hours } = body;
    return this.orderQueryService.syncOrdersByUserId(id, hours, lastSyncTime);
  }

  @Post('notifications/sync') // 💡 Endpoint: POST /notifications/sync
  @Roles(UserRole.OWNER)
  @Permissions(OrderPermissions.VIEW_ORDERS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async syncNotifications(
    @Body() body: Record<string, string | undefined>,
  ): Promise<SyncNotificationResponse> {
    if (!body) {
      return { newOrders: [] };
    }

    return this.orderQueryService.syncNotificationNewsOrders(body);
  }

  @Post('notifications/user/sync')
  @Public()
  async syncNotificationsUser(
    @Body() body: { userId: string; lastSyncTime: string | undefined },
  ): Promise<SyncNotificationUserResponse> {
    return this.orderQueryService.syncNotificationsUser(
      body.userId,
      body.lastSyncTime,
    );
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
    console.log('status');
    return this.orderUpdateService.updateStatus(id, status);
  }

  @Patch('/sync-offline-updates/:id')
  @Roles(UserRole.OWNER)
  syncOfflineFields(
    @Param('id') id: string,
    @Body()
    data: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      deliveryStatus?: DeliveryStatus;
      updatedAt: string; // ISO String desde el Front
    },
  ): Promise<OrderStatus> {
    return this.orderUpdateService.syncOfflineFields(id, data);
  }

  @Patch('/order/payment/status/:id')
  @Public()
  updatePayment(
    @Param('id') id: string,
    @Body('status')
    status: {
      orderPaymentMethod?: PaymentMethodType;
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

  // ================== ELIMINACIÓN ==================

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.orderDeleteService.remove(id);
  }
}
