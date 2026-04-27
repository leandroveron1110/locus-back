import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  OrderStatus,
  PaymentStatus,
  OrderOrigin,
  PaymentMethodType,
  Order,
  NotificationPriority,
  DeliveryType,
} from '@prisma/client';
import {
  AggregateOrderDTO,
  CreateOrderDTO,
  CreateOrderFullDTO,
  CreateOrderSchema,
} from 'src/order/dtos/request/order.dto';
import {
  IOrderCreationService,
  IOrderDeleteService,
  IOrderQueryService,
  IOrderUpdateService,
  IOrderValidationService,
} from 'src/order/interfaces/order-service.interface';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationCommandService } from 'src/notification/service/notification.command.service';
import { TargetEntityType } from 'src/notification/dto/request/create-notification.dto';
import { OrderResponseDtoMapper } from 'src/order/dtos/response/order-response.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DeliveryZonesQueryService } from 'src/delivery-zones/services/delivery-zones-query.service';
import { AddressIndexingService } from 'src/delivery-zones/services/address-indexing.service';
import { canTransition } from 'src/common/constants/allowed_transition';

@Injectable()
export class OrderCommandService
  implements IOrderCreationService, IOrderUpdateService, IOrderDeleteService
{
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IOrderValidationService)
    private orderValidation: IOrderValidationService,
    @Inject(TOKENS.IOrderGateway)
    private readonly orderGateway: IOrderGateway,
    @Inject(TOKENS.IOrderQueryService)
    private readonly orderQueryService: IOrderQueryService,
    private logging: LoggingService,
    private notificationCommanService: NotificationCommandService,
    private deliveryZonesQueryService: DeliveryZonesQueryService,
    private eventEmitter: EventEmitter2,
    private addressIndexingService: AddressIndexingService,
  ) {
    this.logging.setContext(OrderCommandService.name);
    this.logging.setService('OrderModule');
  }

  async updatePayment(
    orderId: string,
    data: {
      orderPaymentMethod?: PaymentMethodType;
      paymentStatus?: PaymentStatus;
      paymentReceiptUrl?: string;
      paymentInstructions?: string;
      paymentHolderName?: string;
    },
  ): Promise<PaymentMethodType> {
    this.logging.log('Iniciando actualización de pago.', {
      orderId,
      newData: data,
    }); // 👈 Log de inicio
    const order = await this.orderQueryService.findOne(orderId);

    // Validaciones básicas
    if (
      data.orderPaymentMethod === PaymentMethodType.TRANSFER &&
      !data.paymentHolderName &&
      !data.paymentReceiptUrl
    ) {
      this.logging.warn(
        'Validación fallida: Nombre de titular y recibo requeridos para transferencia.',
        {
          orderId,
          orderPaymentMethod: data.orderPaymentMethod,
        },
      );
      throw new BadRequestException(
        'El nombre del titular es obligatorio para transferencias',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        orderPaymentMethod: data.orderPaymentMethod ?? order.orderPaymentMethod,
        paymentStatus: data.paymentStatus ?? order.paymentStatus,
        paymentReceiptUrl: data.paymentReceiptUrl ?? order.paymentReceiptUrl,
        paymentInstructions:
          data.paymentInstructions ?? order.paymentInstructions,
        paymentHolderName: data.paymentHolderName ?? order.paymentHolderName,
      },
      select: {
        id: true,
        userId: true,
        businessId: true,
        createdAt: true,
        total: true,
        deliveryType: true,
        orderPaymentMethod: true,
        status: true,
        customerName: true,
        paymentStatus: true,
      },
    });

    if (updatedOrder.paymentStatus == PaymentStatus.IN_PROGRESS) {
      if (updatedOrder.userId) {
        this.orderGateway.emitNewOrder({
          businessId: updatedOrder.businessId,
          userId: updatedOrder.userId,
          id: updatedOrder.id,
          createdAt: updatedOrder.createdAt.toISOString(),
          total: Number(updatedOrder.total),
          deliveryType: updatedOrder.deliveryType,
          orderPaymentMethod: updatedOrder.orderPaymentMethod,
          paymentStatus: updatedOrder.paymentStatus,
          status: updatedOrder.status,
          customerName: updatedOrder.customerName,
        });
      }
      // this.orderGateway.emitNewOrderNotification(fullOrder);
      this.logging.log('Orden en progreso. Evento emitido (New Order).', {
        orderId,
      });
    }

    if (updatedOrder.userId) {
      this.orderGateway.emitPaymentUpdated(
        updatedOrder.id,
        updatedOrder.paymentStatus,
        data.paymentReceiptUrl || '',
        updatedOrder.userId,
        updatedOrder.businessId,
      );
    }

    this.logging.log('Pago de orden actualizado exitosamente.', {
      orderId: updatedOrder.id,
      newPaymentStatus: updatedOrder.paymentStatus,
      orderPaymentMethod: updatedOrder.orderPaymentMethod,
    });

    return updatedOrder.orderPaymentMethod;
  }

  private validateCreateOrderDTO(dto: unknown): AggregateOrderDTO {
    const data = CreateOrderSchema.parse(dto);
    if (!data.businessId || !data.userId || data.items.length === 0) {
      throw new BadRequestException(
        'El DTO debe incluir businessId, userId y al menos un item.',
      );
    }

    return data;
  }

  private recolectIdsForBatchQueries(data: AggregateOrderDTO) {
    // 2. RECOLECTAR IDS PARA BÚSQUEDA MASIVA
    const productIds = data.items.map((i) => i.menuProductId);
    const optionIds = data.items.flatMap((item) =>
      item.optionGroups.flatMap((g) => g.options.map((o) => o.opcionId)),
    );
    const groupIds = data.items.flatMap((item) =>
      item.optionGroups.map((g) => g.opcionGrupoId),
    );

    return { productIds, optionIds, groupIds };
  }

  private async fetchOrderDependencies(
    data: any,
    productIds: string[],
    groupIds: string[],
    optionIds: string[],
  ) {
    const addressIds = [data.deliveryAddressId, data.pickupAddressId].filter(
      Boolean,
    );

    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `
    SELECT 
      (SELECT json_build_object(
                'id', id, 'firstName', nombre, 'lastName', apellido, 'email', email
              ) FROM "usuarios" WHERE id = $1 AND borrado = false) as user,

      (SELECT json_build_object(
                'id', id, 'name', name, 'phone', telefono, 'address', direccion,
                'latitude', latitud, 'longitude', longitud
              ) FROM "negocios" WHERE id = $2 AND borrado = false) as business,

      (SELECT json_agg(json_build_object(
                'id', id, 'street', calle, 'latitude', latitud, 'longitude', longitud,
                'businessId', negocio_id, 'number', numero, 'apartment', departamento, 'notes', notas
              )) FROM "direcciones" WHERE (negocio_id = $2) OR (id = ANY($3))) as addresses,

      (SELECT json_agg(json_build_object(
                'id', id, 'name', nombre, 'imageUrl', imagen_url, 'finalPrice', precio_final
              )) FROM "menu_productos" WHERE id = ANY($4) AND borrado = false) as products,

      (SELECT json_build_object(
                'id', id, 'name', name, 'phone', phone
              ) FROM "DeliveryCompany" WHERE "isActive" = true LIMIT 1) as delivery_company,

      (SELECT json_agg(json_build_object(
                'id', id, 'name', nombre
              )) FROM "opciones_grupos" WHERE id = ANY($5) AND borrado = false) as option_groups,

      (SELECT json_agg(json_build_object(
                'id', id, 'name', nombre, 'priceFinal', precio_final, 'optionGroupId', id_grupo_opcion
              )) FROM "opciones" WHERE id = ANY($6) AND borrado = false) as options
  `,
      data.userId,
      data.businessId,
      addressIds,
      productIds,
      groupIds,
      optionIds,
    );

    const row = result[0] || {};

    const addresses = row.addresses || [];
    const addressBusiness =
      addresses.find((a: any) => a.businessId === data.businessId) || null;
    const addressUser =
      addresses.find((a: any) => a.id === data.deliveryAddressId) || null;

    return {
      user: row.user,
      business: row.business,
      products: row.products || [],
      deliveryCompany: row.delivery_company,
      optionGroups: row.option_groups || [],
      options: row.options || [],
      addressUser,
      addressBusiness,
    };
  }

  private buildOrderItemsAndTotal(
    data: AggregateOrderDTO,
    products: any[],
    options: any[],
    optionGroups: any[],
  ) {
    if (!products) throw new Error('Productos no cargados');

    const productMap = new Map(products.map((p) => [p.id, p]));
    const optionMap = new Map(options.map((o) => [o.id, o]));
    const groupMap = new Map(optionGroups.map((g) => [g.id, g]));

    let totalOrderSum = 0;

    const itemsNestedCreate = data.items.map((item) => {
      const product = productMap.get(item.menuProductId);
      if (!product) {
        throw new Error(`Producto ${item.menuProductId} no existe`);
      }

      const basePrice = Number(product.finalPrice);
      let itemTotalWithoptions = basePrice * item.quantity;

      const optionGroupsToCreate = item.optionGroups.map((group) => {
        const groupDb = groupMap.get(group.opcionGrupoId);
        if (!groupDb) {
          throw new Error(`Grupo ${group.opcionGrupoId} no existe`);
        }

        const optionsInsideGroup = group.options.map((opt) => {
          const optionDb = optionMap.get(opt.opcionId);

          if (!optionDb || optionDb.optionGroupId !== group.opcionGrupoId) {
            throw new Error(`Opción inválida: ${opt.opcionId}`);
          }

          const optionPrice = Number(optionDb.priceFinal);

          itemTotalWithoptions += optionPrice * opt.quantity * item.quantity;

          return {
            opcionId: optionDb.id,
            optionName: optionDb.name,
            priceFinal: optionPrice,
            quantity: opt.quantity,
            priceWithoutTaxes: 0,
            taxesAmount: 0,
            priceModifierType: 'FIXED',
          };
        });

        return {
          opcionGrupoId: groupDb.id,
          groupName: groupDb.name,
          minQuantity: 0,
          maxQuantity: 1,
          quantityType: 'SINGLE',
          options: {
            create: optionsInsideGroup,
          },
        };
      });

      totalOrderSum += itemTotalWithoptions;

      return {
        productName: product.name,
        productDescription: product.description,
        productImageUrl: product.imageUrl,
        productPaymentMethod: data.orderPaymentMethod,
        quantity: item.quantity,
        priceAtPurchase: basePrice,
        notes: '',
        menuProductId: product.id,
        optionGroups: {
          create: optionGroupsToCreate,
        },
      };
    });

    return {
      itemsNestedCreate,
      totalOrderSum,
    };
  }

  async build(dto: unknown): Promise<any> {
    const data = this.validateCreateOrderDTO(dto);
    const { productIds, optionIds, groupIds } =
      this.recolectIdsForBatchQueries(data);

    // 1. Todo el I/O de lectura ocurre aquí (1 solo await grande)
    const deps = await this.fetchOrderDependencies(
      data,
      productIds,
      groupIds,
      optionIds,
    );
    const {
      user,
      business,
      products,
      optionGroups,
      options,
      deliveryCompany,
      addressUser,
      addressBusiness,
    } = deps;

    if (!user || !business)
      throw new NotFoundException('Usuario o Negocio no encontrado');

    // 2. Lógica de negocio pura (CPU - Microsegundos)
    const { itemsNestedCreate, totalOrderSum } = this.buildOrderItemsAndTotal(
      data,
      products,
      options,
      optionGroups,
    );

    let totalDeliveryCost = 0;

    // 3. Cálculo de envío SIN CONSULTAS A DB
    if (data.deliveryType === 'DELIVERY' && deliveryCompany) {
      const deliveryPrice =
        await this.deliveryZonesQueryService.getAutoDeliveryPrice(
          data.businessId,
          addressUser.id,
        );

      if (!deliveryPrice.price) {
        throw new NotFoundException('Precio del envio no encontrado');
      }

      totalDeliveryCost = deliveryPrice.price;
    }

    const isCash = data.orderPaymentMethod === 'CASH';

    const initialStatus = isCash
      ? OrderStatus.PENDING_CONFIRMATION
      : OrderStatus.PENDING;

    const initialPaymentStatus = isCash
      ? PaymentStatus.PENDING // En efectivo siempre está pendiente hasta que se entrega
      : PaymentStatus.PENDING; // En transferencia está pendiente hasta que sube el comprobante

    // 4. Escritura optimizada (SELECT mínimo)
    const newOrder = await this.prisma.order.create({
      data: {
        userId: data.userId,
        businessId: business.id,
        deliveryAddressId: data.deliveryAddressId,
        pickupAddressId: data.pickupAddressId,
        deliveryCompanyId: deliveryCompany?.id,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhone: user.email,
        customerAddress: addressUser?.street
          ? `${addressUser.street} ${addressUser.number}`
          : null,
        customerAddresslatitude: addressUser?.latitude,
        customerAddresslongitude: addressUser?.longitude,
        customerObservations: `${addressUser.apartment}, ${addressUser.notes}`,
        businessName: business.name,
        businessPhone: business.phone,
        businessAddress: business.address,
        businessAddresslatitude: addressBusiness?.latitude || 0,
        businessAddresslongitude: addressBusiness?.longitude || 0,
        deliveryCompanyName: deliveryCompany?.name,
        deliveryCompanyPhone: deliveryCompany?.phone,
        total: new Prisma.Decimal(totalOrderSum),
        totalDeliveryCost: new Prisma.Decimal(totalDeliveryCost),
        orderPaymentMethod: data.orderPaymentMethod,
        deliveryType: data.deliveryType,
        notes: data.notes,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentExpected: {},
        paymentReceived: {},
        OrderItem: { create: itemsNestedCreate },
      },
      // No usamos include masivo para que el INSERT + SELECT sea veloz
      select: {
        id: true,
        userId: true,
        businessId: true,
        businessName: true,
        createdAt: true,
        total: true,
        deliveryType: true,
        orderPaymentMethod: true,
        status: true,
        customerName: true,
        paymentStatus: true,
      },
    });

    if (newOrder.userId) {
      this.orderGateway.emitNewOrder({
        businessId: newOrder.businessId,
        userId: newOrder.userId,
        id: newOrder.id,
        createdAt: newOrder.createdAt.toISOString(),
        total: Number(newOrder.total),
        deliveryType: newOrder.deliveryType,
        orderPaymentMethod: newOrder.orderPaymentMethod,
        paymentStatus: newOrder.paymentStatus,
        status: newOrder.status,
        customerName: newOrder.customerName,
      });
    }

    // // 5. Fire and Forget
    // this.eventEmitter.emit('notification.createdneworder', {
    //   orderId: newOrder.id,
    //   businessId: newOrder.businessId,
    //   businessName: newOrder.businessName,
    //   total: newOrder.total.toString(),
    // });

    return newOrder;
  }

  @OnEvent('notification.createdneworder', { async: true })
  async handleOrderNotification(order: {
    orderId: string;
    businessId: string;
    businessName: string;
    total: string;
  }) {
    const shortOrderId = `#${order.orderId.slice(0, 6).toUpperCase()}`;

    const message = `🚨 ${order.businessName} ha recibido un nuevo pedido ${shortOrderId} por $${order.total}. ¡Revisa los detalles y prepárate para la acción!`;

    await this.notificationCommanService.create({
      category: 'ORDER',
      type: 'ORDER_STATUS',
      title: 'Nueva Orden',
      message,
      targetEntityId: order.businessId,
      priority: NotificationPriority.HIGH,
      targetEntityType: TargetEntityType.BUSINESS,
    });
  }

  async updateStatus(id: string, newStatus: OrderStatus) {
    try {
      this.logging.log('Iniciando transacción de actualización.', {
        orderId: id,
        newStatus,
      });

      // Ejecutamos todo dentro de una transacción atómica
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Buscamos la orden dentro de la transacción
        const currentOrder = await tx.order.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            userId: true,
            businessId: true,
            deliveryCompanyId: true,
            total: true,
          },
        });

        if (!currentOrder) throw new Error('Orden no encontrada');

        // 2. Validamos la transición con la lógica que ya tenemos
        if (!canTransition(currentOrder.status, newStatus)) {
          throw new Error(
            `Transición ilegal: de ${currentOrder.status} a ${newStatus}`,
          );
        }

        // 3. Si es válida, actualizamos
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });

        return { updatedOrder, currentOrder };
      });

      // 4. Fuera de la transacción (una vez confirmada), emitimos eventos
      // Esto es mejor afuera para no retrasar el cierre de la transacción en la BD
      const { updatedOrder, currentOrder } = result;

      if (currentOrder.userId) {
        this.orderGateway.emitOrderStatusUpdated(
          updatedOrder.id,
          updatedOrder.status,
          currentOrder.userId,
          currentOrder.businessId,
          currentOrder.deliveryCompanyId,
        );

        this.emitUserNotification({
          id: updatedOrder.id,
          status: updatedOrder.status,
          total: `${currentOrder.total}`,
          targetEntityId: currentOrder.userId,
          targetEntityType: TargetEntityType.USER,
        });
      }

      return updatedOrder.status;
    } catch (error) {
      this.logging.error('Fallo en la actualización atómica.', {
        orderId: id,
        newStatus,
        error: error.message,
      });
      throw error;
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<PaymentStatus> {
    try {
      return await this.prisma
        .$transaction(async (tx) => {
          // 1. Obtener orden actual
          const currentOrder = await tx.order.findUnique({
            where: { id: orderId },
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              userId: true,
              businessId: true,
              deliveryCompanyId: true,
              total: true,
            },
          });

          if (!currentOrder)
            throw new NotFoundException(`Order ${orderId} not found`);

          // 2. Validar transición de pago (Tu lógica actual)
          const validInitialStates: PaymentStatus[] = [
            PaymentStatus.PENDING,
            PaymentStatus.IN_PROGRESS,
          ];
          if (!validInitialStates.includes(currentOrder.paymentStatus)) {
            throw new BadRequestException(
              `Cannot change payment status from ${currentOrder.paymentStatus}`,
            );
          }

          // 3. Determinar el nuevo estado de la orden (Lógica de negocio)
          let nextStatus = currentOrder.status; // Por defecto no cambia
          if (paymentStatus === PaymentStatus.CONFIRMED)
            nextStatus = OrderStatus.CONFIRMED;
          if (paymentStatus === PaymentStatus.REJECTED)
            nextStatus = OrderStatus.REJECTED_BY_BUSINESS;

          // 4. VALIDACIÓN DE SEGURIDAD: ¿Es este cambio de estado legal?
          if (
            nextStatus !== currentOrder.status &&
            !canTransition(currentOrder.status, nextStatus)
          ) {
            throw new Error(
              `Transición ilegal: No se puede cambiar a ${nextStatus} tras el pago.`,
            );
          }

          // 5. Actualización Atómica
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus, status: nextStatus },
          });

          return { updatedOrder, currentOrder };
        })
        .then(async (result) => {
          const { updatedOrder, currentOrder } = result;

          // 6. EVENTOS (Fuera de la transacción)
          if (paymentStatus === PaymentStatus.IN_PROGRESS) {
            // Tu lógica de emitNewOrder...
          }

          if (updatedOrder.userId) {
            this.orderGateway.emitOrderStatusUpdated(
              updatedOrder.id,
              updatedOrder.status,
              updatedOrder.userId,
              updatedOrder.businessId,
              updatedOrder.deliveryCompanyId,
            );

            this.orderGateway.emitPaymentUpdated(
              updatedOrder.id,
              updatedOrder.paymentStatus,
              updatedOrder.paymentReceiptUrl || '',
              updatedOrder.userId,
              updatedOrder.businessId,
            );
          }

          this.logging.log(
            'Estado de pago y orden actualizados exitosamente. Eventos emitidos.',
            {
              orderId: updatedOrder.id,
              finalPaymentStatus: updatedOrder.paymentStatus,
              finalOrderStatus: updatedOrder.status,
            },
          );
          return updatedOrder.paymentStatus;

          return updatedOrder.paymentStatus;
        });
    } catch (error) {
      // Tu lógica de log y manejo de errores...
      throw error;
    }
  }

  async remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }

  private emitUserNotification(order: {
    id: string;
    targetEntityId: string;
    total: string;
    status: OrderStatus;
    targetEntityType: TargetEntityType;
  }) {
    const shortOrderId = `#${order.id.slice(0, 6).toUpperCase()}`; // ID corto en mayúsculas

    let title: string = '';
    let message: string = '';
    let priority: NotificationPriority = 'LOW'; // Prioridad base
    let shouldNotify: boolean = true; // Renombrado de isSwitchCase a shouldNotify

    switch (order.status) {
      case OrderStatus.READY_FOR_CUSTOMER_PICKUP:
        title = '¡Listo para recoger!';
        message = `Tu pedido ${shortOrderId} te está esperando. ¡Pasa por aquí cuando quieras!`;
        priority = 'HIGH';
        break;

      case OrderStatus.OUT_FOR_DELIVERY:
        title = '¡Tu pedido está en camino!';
        message = `El repartidor va en camino con tu pedido ${shortOrderId}.`;
        priority = 'MEDIUM';
        break;

      case OrderStatus.DELIVERED:
        title = '¡Pedido entregado! ✅';
        message = `Tu pedido ${shortOrderId} ha sido completado. ¡Esperamos que lo disfrutes!`;
        priority = 'LOW';
        break;

      case OrderStatus.CANCELLED_BY_BUSINESS:
        title = 'Pedido CANCELADO';
        message = `Lamentamos informarte que el negocio tuvo que cancelar tu pedido ${shortOrderId}. Revisa los detalles.`;
        priority = 'HIGH';
        break;

      case OrderStatus.CANCELLED_BY_DELIVERY:
        title = 'Pedido CANCELADO';
        message = `Hubo un problema con el delivery. Tu pedido ${shortOrderId} fue cancelado por el repartidor.`;
        priority = 'HIGH';
        break;

      // Si hay más estados, se añadirían aquí (ej: REFUNDED)
      default:
        // No notificar para estados no críticos/no definidos
        shouldNotify = false;
        break;
    }

    if (shouldNotify) {
      this.notificationCommanService.create({
        category: 'ORDER',
        type: 'ORDER_STATUS',
        title,
        message,
        targetEntityId: order.targetEntityId,
        priority: priority,
        targetEntityType: order.targetEntityType,
      });

      this.logging.log('User order notification sent', {
        targetEntityId: order.targetEntityId,
        orderId: order.id,
        status: order.status,
      });
    }
  }
}
