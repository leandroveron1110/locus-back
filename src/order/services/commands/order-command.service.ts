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
    });

    if (updatedOrder.paymentStatus == PaymentStatus.IN_PROGRESS) {
      const fullOrder = await this.orderQueryService.findOne(updatedOrder.id);
      this.orderGateway.emitNewOrder(fullOrder);
      this.orderGateway.emitNewOrderNotification(fullOrder);
      this.logging.log('Orden en progreso. Evento emitido (New Order).', {
        orderId,
      });
    }

    this.orderGateway.emitPaymentUpdated(
      updatedOrder.id,
      updatedOrder.paymentStatus,
      data.paymentReceiptUrl || '',
      updatedOrder.userId,
      updatedOrder.businessId,
    );

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
  const addressIds = [data.deliveryAddressId, data.pickupAddressId].filter(Boolean);

  const result = await this.prisma.$queryRawUnsafe<any[]>(`
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
                'businessId', negocio_id
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
              )) FROM "opciones" WHERE id = ANY($6) AND borrado = false) as options,

      -- CORRECCIÓN AQUÍ: Traemos todos los campos de validación
      (SELECT json_agg(json_build_object(
                'id', id, 
                'name', name,
                'price', price,
                'geometry', geometry,
                'hasTimeLimit', "hasTimeLimit",
                'startTime', "startTime",
                'endTime', "endTime"
              )) 
       FROM "DeliveryZone" 
       WHERE "deliveryCompanyId" = (SELECT id FROM "DeliveryCompany" WHERE "isActive" = true LIMIT 1) 
       AND "isActive" = true) as delivery_zones
  `, 
  data.userId, data.businessId, addressIds, productIds, groupIds, optionIds
  );

  const row = result[0] || {};
  const rawZones = row.delivery_zones || [];

  // LIMPIEZA DE DATOS: Esto es vital para que calculatePricePure funcione
  const cleanedZones = rawZones.map(zone => ({
    ...zone,
    // Si SQL devuelve el JSON como string, lo parseamos. Si ya es objeto, lo dejamos.
    geometry: typeof zone.geometry === 'string' ? JSON.parse(zone.geometry) : zone.geometry,
    price: Number(zone.price)
  }));

  const addresses = row.addresses || [];
  const addressBusiness = addresses.find((a: any) => a.businessId === data.businessId) || null;
  const addressUser = addresses.find((a: any) => a.id === data.deliveryAddressId) || null;

  return {
    user: row.user,
    business: row.business,
    products: row.products || [],
    deliveryCompany: row.delivery_company,
    optionGroups: row.option_groups || [],
    options: row.options || [],
    addressUser,
    addressBusiness,
    deliveryZones: cleanedZones // Pasamos las zonas ya limpias y parseadas
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
      deliveryZones,
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
      const deliveryPriceResult =
        await this.deliveryZonesQueryService.calculatePricePure(
          deliveryZones, // Le pasamos las zonas que ya bajamos en deps
          Number(addressUser?.latitude),
          Number(addressUser?.longitude),
          Number(addressBusiness?.latitude),
          Number(addressBusiness?.longitude),
        );

      if (deliveryPriceResult.price === null)
        throw new BadRequestException(deliveryPriceResult.message);
      totalDeliveryCost = deliveryPriceResult.price;
    }

    // 4. Escritura optimizada (SELECT mínimo)
    const result = await this.prisma.order.create({
      data: {
        userId: data.userId,
        businessId: business.id,
        deliveryAddressId: data.deliveryAddressId,
        pickupAddressId: data.pickupAddressId,
        deliveryCompanyId: deliveryCompany?.id,
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhone: user.email,
        customerAddresslatitude: addressUser?.latitude,
        customerAddresslongitude: addressUser?.longitude,
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
        paymentExpected: {
          orderTotal: totalOrderSum,
          delivery: totalDeliveryCost,
          final: totalOrderSum + totalDeliveryCost,
        },
        paymentReceived: {},
        OrderItem: { create: itemsNestedCreate },
      },
      // No usamos include masivo para que el INSERT + SELECT sea veloz
      select: { id: true, total: true, deliveryType: true },
    });

    // 5. Fire and Forget
    this.eventEmitter.emit('notification.createdneworder', {
      orderId: result.id,
    });

    return result;
  }

  @OnEvent('notification.createdneworder', { async: true })
  async handleOrderNotification(payload: { orderId: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: payload.orderId },
      include: {
        business: true,
        user: true,
      },
    });

    if (!order) return;

    const shortOrderId = `#${order.id.slice(0, 6).toUpperCase()}`;

    const message = `🚨 ${order.business.name}
${shortOrderId}
Total: $${order.total}`;

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

  // Metodo para la creacion completa de una orden
  async createFullOrder(dto: CreateOrderFullDTO): Promise<Order> {
    try {
      // validacion antes de crear la orden
      await this.orderValidation.validateCreateFullOrder(dto);

      // 1. Reestructurar los datos para el formato de Nested Writes de Prisma
      const { items, pickupAddressId, deliveryAddressId, ...baseOrderData } =
        dto;

      // Transformar la estructura de 'items' para que coincida con la entrada anidada de Prisma.
      // Es necesario mapear los datos de la DTO a la estructura 'create' esperada por Prisma.
      const itemsForPrisma = items.map((item) => ({
        // Campos del OrderItem
        menuProductId: item.menuProductId,
        productName: item.productName,
        productDescription: item.productDescription,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        notes: item.notes,
        productPaymentMethod: item.productPaymentMethod,

        // Anidación de OrderOptionGroup
        optionGroups: {
          create: item.optionGroups.map((group) => ({
            // Campos del OrderOptionGroup
            groupName: group.groupName,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            quantityType: group.quantityType,
            opcionGrupoId: group.opcionGrupoId,

            // Anidación de OrderOption
            options: {
              create: group.options.map((option) => ({
                // Campos del OrderOption
                optionName: option.optionName,
                priceModifierType: option.priceModifierType,
                quantity: option.quantity,
                priceFinal: option.priceFinal,
                priceWithoutTaxes: option.priceWithoutTaxes,
                taxesAmount: option.taxesAmount,
                opcionId: option.opcionId,
              })),
            },
          })),
        },
      }));

      // 2. Realizar la operación de creación en una sola consulta
      const createdOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            ...baseOrderData,
            pickupAddressId: pickupAddressId,
            deliveryAddressId: deliveryAddressId,
            origin: OrderOrigin.WEB, // Sobreescribe el default/opcional del DTO si es necesario
            paymentExpected: {},
            paymentReceived: {},
            // Relación anidada: Crea todos los items y sus sub-relaciones
            OrderItem: {
              create: itemsForPrisma,
            },
          },
        });

        this.logging.debug('Orden creada dentro de la transacción.', {
          orderId: order.id,
          status: order.status,
        });

        // Retornamos el objeto Order recién creado
        return order;
      });

      // 3. Obtener la orden completa y emitir el evento (si fuera necesario)
      // Nota: Si usaste 'include' en el paso 2, podrías usar directamente el 'createdOrder'
      const fullOrder = await this.orderQueryService.findOne(createdOrder.id);
      this.orderGateway.emitNewOrder(fullOrder);
      // this.orderGateway.emitNewOrderNotification(fullOrder);

      const shortOrderId = `#${fullOrder.id.slice(0, 6).toUpperCase()}`; // ID corto en mayúsculas

      // Lógica de mapeo (debe estar definida en algún lugar cerca o importada)
      // 1. Mapeo del método de pago (función reutilizable)
      const getorderPaymentMethodLabel = (
        orderPaymentMethod: PaymentMethodType,
      ): string => {
        switch (orderPaymentMethod) {
          case 'CASH':
            return 'Efectivo';
          case 'TRANSFER':
            return 'Transferencia';
          default:
            return 'Desconocido';
        }
      };

      // 2. 🟢 Mapeo del tipo de envío (NUEVA FUNCIÓN)
      type DeliveryType =
        | 'DELIVERY'
        | 'PICKUP'
        | 'IN_HOUSE_DELIVERY'
        | 'EXTERNAL_DELIVERY';

      const getDeliveryTypeLabel = (deliveryType: DeliveryType): string => {
        switch (deliveryType) {
          case 'PICKUP':
            return 'Retira en local';
          case 'DELIVERY':
          case 'IN_HOUSE_DELIVERY':
            return 'Envío propio';
          case 'EXTERNAL_DELIVERY':
            return 'Envío externo';
          default:
            return 'Envío desconocido';
        }
      };

      // --- LÓGICA DENTRO DEL CÓDIGO DE NOTIFICACIÓN ---

      // Mapeo de valores
      const orderPaymentMethod: PaymentMethodType =
        fullOrder.orderPaymentMethod;
      const typeEnvio: DeliveryType = fullOrder.deliveryType;

      const orderPaymentMethodLabel =
        getorderPaymentMethodLabel(orderPaymentMethod);
      const deliveryTypeLabel = getDeliveryTypeLabel(typeEnvio);

      const message = `🚨 ${fullOrder.business.name}
      ${shortOrderId} ${fullOrder.user.fullName.toLocaleUpperCase()}
      Total: $${fullOrder.total} ${orderPaymentMethodLabel}
      Entrega: ${deliveryTypeLabel}`;

      this.notificationCommanService.create({
        category: 'ORDER',
        type: 'ORDER_STATUS',
        title: 'Nueva Orden',
        message,
        targetEntityId: fullOrder.businessId,
        priority: NotificationPriority.HIGH,
        targetEntityType: TargetEntityType.BUSINESS,
      });

      this.logging.log('Business order notification sent', {
        targetEntityId: fullOrder.businessId,
        orderId: fullOrder.id,
        status: fullOrder.status,
      });
      this.logging.log('Evento de nueva orden emitido.', {
        orderId: fullOrder.id,
      });

      // 4. Devolver la orden
      this.logging.log('Orden completa creada exitosamente.', {
        orderId: createdOrder.id,
        userId: createdOrder.userId,
      }); // 👈 Log de éxito
      return createdOrder;
    } catch (error) {
      this.logging.error('Error al crear la orden completa.', {
        userId: dto.userId,
        businessId: dto.businessId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus) {
    try {
      this.logging.log('Iniciando actualización de estado de orden.', {
        orderId: id,
        newStatus: status,
      }); // 👈 Log de inicio
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: { status },
      });

      this.orderGateway.emitOrderStatusUpdated(
        updatedOrder.id,
        updatedOrder.status,
        updatedOrder.userId,
        updatedOrder.businessId,
        updatedOrder.deliveryCompanyId,
      );

      this.emitUserNotification({
        id: updatedOrder.id,
        status: updatedOrder.status,
        total: `${updatedOrder.total}`,
        targetEntityId: updatedOrder.userId,
        targetEntityType: TargetEntityType.USER,
      });

      this.logging.log(
        'Estado de orden actualizado exitosamente y evento emitido.',
        {
          orderId: updatedOrder.id,
          newStatus: updatedOrder.status,
          userId: updatedOrder.userId,
        },
      );
      return updatedOrder.status;
    } catch (error) {
      this.logging.error('Error al actualizar el estado de la orden.', {
        orderId: id,
        newStatus: status,
        error: error.message,
      }); // 👈 Log de error
      throw error;
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<PaymentStatus> {
    this.logging.log('Iniciando actualización de estado de pago.', {
      orderId,
      newPaymentStatus: paymentStatus,
    }); // 👈 Log de inicio
    try {
      // 1. Validar la existencia y estado actual de la orden
      const currentOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      });

      if (!currentOrder) {
        this.logging.warn(`Orden no encontrada.`, { orderId });
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      const validInitialStates: PaymentStatus[] = [
        PaymentStatus.PENDING,
        PaymentStatus.IN_PROGRESS,
      ];
      if (!validInitialStates.includes(currentOrder.paymentStatus)) {
        this.logging.warn(`Intento de cambio de estado de pago inválido.`, {
          orderId,
          currentPaymentStatus: currentOrder.paymentStatus,
          targetPaymentStatus: paymentStatus,
        });
        throw new BadRequestException(
          `Cannot change payment status of an order that is already ${currentOrder.paymentStatus}.`,
        );
      }

      // 2. Determinar el nuevo estado de la orden en base al estado de pago
      let newOrderStatus: OrderStatus;
      switch (paymentStatus) {
        case PaymentStatus.CONFIRMED:
          newOrderStatus = OrderStatus.CONFIRMED;
          break;
        case PaymentStatus.REJECTED:
          newOrderStatus = OrderStatus.REJECTED_BY_BUSINESS;
          break;
        default:
          // Si el estado de pago es IN_PROGRESS o PENDING, el estado de la orden no cambia
          newOrderStatus = currentOrder.status;
          break;
      }

      this.logging.debug('Nuevo estado de orden determinado.', {
        orderId,
        newOrderStatus,
      });
      // 3. Actualizar la orden de forma atómica
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: paymentStatus,
          status: newOrderStatus,
        },
      });

      if (paymentStatus == PaymentStatus.IN_PROGRESS) {
        const fullOrder = await this.orderQueryService.findOne(updatedOrder.id);
        this.orderGateway.emitNewOrder(fullOrder);
        this.orderGateway.emitNewOrderNotification(fullOrder);
        this.logging.log('Orden en progreso. Evento emitido (New Order).', {
          orderId,
        });
      }

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

      this.logging.log(
        'Estado de pago y orden actualizados exitosamente. Eventos emitidos.',
        {
          orderId: updatedOrder.id,
          finalPaymentStatus: updatedOrder.paymentStatus,
          finalOrderStatus: updatedOrder.status,
        },
      );
      return updatedOrder.paymentStatus;
    } catch (error) {
      // Relanzar el error o devolver un mensaje amigable
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logging.error(
        'Error interno al procesar la actualización de estado de pago.',
        {
          orderId: orderId,
          targetPaymentStatus: paymentStatus,
          stack: error.stack,
        },
      );
      throw new InternalServerErrorException(
        'Error processing payment status update.',
      );
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
