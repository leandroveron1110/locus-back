import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  NotificationPriority,
  DeliveryStatus,
} from '@prisma/client';
import {
  AggregateOrderDTO,
  CreateOrderSchema,
  BusinessSyncOrderDTO,
  BusinessSyncOrderSchema,
  SyncBusinessOrderDTO,
} from 'src/order/dtos/request/order.dto';
import {
  IOrderCreationService,
  IOrderDeleteService,
  IOrderQueryService,
  IOrderUpdateService,
} from 'src/order/interfaces/order-service.interface';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { LoggingService } from 'src/logging/logging.service';
import { NotificationCommandService } from 'src/notification/service/notification.command.service';
import { TargetEntityType } from 'src/notification/dto/request/create-notification.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryZonesQueryService } from 'src/delivery-zones/services/delivery-zones-query.service';
import {
  canChangeOrderStatus,
  PAYMENT_TRANSITIONS,
} from 'src/common/constants/allowed_transition';

@Injectable()
export class OrderCommandService
  implements IOrderCreationService, IOrderUpdateService, IOrderDeleteService
{
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IOrderValidationService)
    @Inject(TOKENS.IOrderGateway)
    private readonly orderGateway: IOrderGateway,
    @Inject(TOKENS.IOrderQueryService)
    private readonly orderQueryService: IOrderQueryService,
    private logging: LoggingService,
    private notificationCommanService: NotificationCommandService,
    private deliveryZonesQueryService: DeliveryZonesQueryService,
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

    const initialStatus = OrderStatus.PENDING;

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
        customerObservations: addressUser
          ? `${addressUser.apartment}, ${addressUser.notes}`
          : null,
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

    // if (newOrder.userId) {
    //   this.orderGateway.emitNewOrder({
    //     businessId: newOrder.businessId,
    //     userId: newOrder.userId,
    //     id: newOrder.id,
    //     createdAt: newOrder.createdAt.toISOString(),
    //     total: Number(newOrder.total),
    //     deliveryType: newOrder.deliveryType,
    //     orderPaymentMethod: newOrder.orderPaymentMethod,
    //     paymentStatus: newOrder.paymentStatus,
    //     status: newOrder.status,
    //     customerName: newOrder.customerName,
    //   });
    // }

    // // 5. Fire and Forget
    // this.eventEmitter.emit('notification.createdneworder', {
    //   orderId: newOrder.id,
    //   businessId: newOrder.businessId,
    //   businessName: newOrder.businessName,
    //   total: newOrder.total.toString(),
    // });

    return newOrder;
  }

  async syncOrderFromBusiness(data: SyncBusinessOrderDTO) {
    // 1. Verificar si ya fue sincronizada previamente usando el idTemp único
    const existOrder = await this.prisma.order.findFirst({
      where: { idTemp: data.idTemp },
      select: { id: true, shortCode: true, createdAt: true },
    });

    if (existOrder) {
      return existOrder; // Evitamos duplicar y devolvemos consistencia
    }
    // Esto lo podemos cachear o traerlo rápido.
    const business = await this.prisma.business.findUnique({
      where: { id: data.businessId },
      select: {
        name: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!business) throw new Error('Negocio no encontrado');

    // 2. Creación en un solo paso
    const newOrder = await this.prisma.order.create({
      data: {
        idTemp: data.idTemp,
        businessId: data.businessId,
        userId: data.userId || null,

        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),

        // Snapshots del Cliente
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress:
          data.deliveryType === 'DELIVERY'
            ? 'Venta en mostrador / Local'
            : null,

        // Snapshots del Negocio
        businessName: business.name,
        businessPhone: business.phone || '',
        businessAddress: business.address || '',
        businessAddresslatitude: business.latitude || 0,
        businessAddresslongitude: business.longitude || 0,

        // Totales (Hechos)
        total: new Prisma.Decimal(data.total),
        totalDeliveryCost: new Prisma.Decimal(data.totalDeliveryCost),
        paymentExpected: data.paymentExpected,
        paymentReceived: data.paymentReceived,

        // Estados
        deliveryType: data.deliveryType,
        orderPaymentMethod: data.orderPaymentMethod,
        origin: 'BUSINESS',
        status: 'PENDING',
        shortCode: data.shortCode,
        dailyNumber: data.dailyNumber,
        // Items Anidados
        OrderItem: {
          create: data.items.map((item) => ({
            menuProductId: item.menuProductId,
            productName: item.productName,
            productDescription: item.productDescription,
            quantity: item.quantity,
            priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
            optionGroups: {
              create: item.optionGroups.map((group) => ({
                groupName: group.groupName,
                minQuantity: group.minQuantity,
                maxQuantity: group.maxQuantity,
                quantityType: group.quantityType,
                options: {
                  create: group.options.map((opt) => ({
                    opcionId: opt.opcionId,
                    optionName: opt.optionName,
                    priceFinal: new Prisma.Decimal(opt.priceFinal),
                    priceWithoutTaxes: new Prisma.Decimal(opt.priceFinal), // Simplificado para POS
                    taxesAmount: new Prisma.Decimal(0),
                    priceModifierType: 'FIXED',
                    quantity: opt.quantity,
                  })),
                },
              })),
            },
          })),
        },

        // Evento inicial de auditoría
        events: {
          create: {
            stateType: 'ORDER',
            value: 'CREATED_FROM_POS',
            author: 'BUSINESS',
          },
        },
      },
      select: {
        id: true,
        shortCode: true,
        createdAt: true,
      },
    });

    return newOrder;
  }

  async syncBatchOrdersFromBusiness(payload: {
    businessId: string;
    orders: SyncBusinessOrderDTO[];
  }) {
    const { businessId, orders } = payload;

    // =========================================================
    // 1. VALIDACIONES BÁSICAS
    // =========================================================

    if (!orders.length) {
      return [];
    }

    // =========================================================
    // 2. OBTENEMOS SNAPSHOT DEL NEGOCIO UNA SOLA VEZ
    // =========================================================

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!business) {
      throw new Error('Negocio no encontrado');
    }

    // =========================================================
    // 3. MAPEO IDEMPOTENTE INICIAL
    // =========================================================

    const targetIdTemps = orders
      .map((o) => o.idTemp)
      .filter(Boolean) as string[];

    const existingOrders = await this.prisma.order.findMany({
      where: {
        idTemp: {
          in: targetIdTemps,
        },
      },
      select: {
        id: true,
        idTemp: true,
      },
    });

    const existingMap = new Map(existingOrders.map((o) => [o.idTemp!, o.id]));

    type SyncResult = {
      idTemp: string;
      cloudId?: string;
      status: 'SUCCESS' | 'ERROR';
      error?: string;
    };

    const results: SyncResult[] = [];

    // =========================================================
    // 4. RESPONDEMOS DIRECTO LOS YA EXISTENTES
    // =========================================================

    for (const [idTemp, cloudId] of existingMap.entries()) {
      results.push({
        idTemp,
        cloudId,
        status: 'SUCCESS',
      });
    }

    // =========================================================
    // 5. FILTRAMOS SOLO LOS NUEVOS
    // =========================================================

    const ordersToCreate = orders.filter((o) => !existingMap.has(o.idTemp));

    // =========================================================
    // 6. CONCURRENCY LIMIT
    // =========================================================

    const CONCURRENCY_LIMIT = 5;

    for (let i = 0; i < ordersToCreate.length; i += CONCURRENCY_LIMIT) {
      const slice = ordersToCreate.slice(i, i + CONCURRENCY_LIMIT);

      const settled = await Promise.allSettled(
        slice.map(async (orderData) => {
          try {
            const created = await this.prisma.order.create({
              data: {
                idTemp: orderData.idTemp,

                businessId,

                userId: orderData.userId || null,

                customerName: orderData.customerName,

                createdAt: orderData.createdAt
                  ? new Date(orderData.createdAt)
                  : new Date(),

                customerPhone: orderData.customerPhone,

                customerAddress:
                  orderData.deliveryType === 'DELIVERY'
                    ? 'Envío a domicilio'
                    : 'Venta en mostrador / Local',

                // =====================================================
                // SNAPSHOT NEGOCIO
                // =====================================================

                businessName: business.name,

                businessPhone: business.phone || '',

                businessAddress: business.address || '',

                businessAddresslatitude: business.latitude || 0,

                businessAddresslongitude: business.longitude || 0,

                // =====================================================
                // TOTALES
                // =====================================================

                total: new Prisma.Decimal(orderData.total),

                totalDeliveryCost: new Prisma.Decimal(
                  orderData.totalDeliveryCost || 0,
                ),

                paymentExpected: orderData.paymentExpected || {},

                paymentReceived: orderData.paymentReceived || {},

                // =====================================================
                // ESTADOS
                // =====================================================

                deliveryType: orderData.deliveryType,

                orderPaymentMethod: orderData.orderPaymentMethod,

                origin: 'BUSINESS',

                status: orderData.status || 'PENDING',

                deliveryStatus: orderData.deliveryStatus || 'NOT_APPLICABLE',

                paymentStatus: orderData.paymentStatus || 'PENDING',

                shortCode: orderData.shortCode,

                dailyNumber: orderData.dailyNumber,

                // =====================================================
                // ITEMS
                // =====================================================

                OrderItem: {
                  create: orderData.items.map((item) => ({
                    menuProductId: item.menuProductId,

                    productName: item.productName,

                    productDescription: item.productDescription || '',

                    quantity: item.quantity,

                    priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),

                    optionGroups: {
                      create: item.optionGroups.map((group) => ({
                        groupName: group.groupName,

                        minQuantity: group.minQuantity || 0,

                        maxQuantity: group.maxQuantity || 1,

                        quantityType: group.quantityType || 'SINGLE',

                        options: {
                          create: group.options.map((opt) => ({
                            opcionId: opt.opcionId,

                            optionName: opt.optionName,

                            priceFinal: new Prisma.Decimal(opt.priceFinal),

                            priceWithoutTaxes: new Prisma.Decimal(
                              opt.priceFinal,
                            ),

                            taxesAmount: new Prisma.Decimal(0),

                            priceModifierType: 'FIXED',

                            quantity: opt.quantity,
                          })),
                        },
                      })),
                    },
                  })),
                },

                // =====================================================
                // EVENTO INICIAL
                // =====================================================

                events: {
                  create: {
                    stateType: 'ORDER',
                    value: 'CREATED_FROM_BATCH_POS',
                    author: 'BUSINESS',
                  },
                },
              },

              select: {
                id: true,
              },
            });

            return {
              idTemp: orderData.idTemp,
              cloudId: created.id,
              status: 'SUCCESS' as const,
            };
          } catch (err: any) {
            // =====================================================
            // IDEMPOTENCIA REAL (RACE CONDITION)
            // =====================================================

            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2002'
            ) {
              const existing = await this.prisma.order.findFirst({
                where: {
                  idTemp: orderData.idTemp,
                },
                select: {
                  id: true,
                },
              });

              if (existing) {
                return {
                  idTemp: orderData.idTemp,
                  cloudId: existing.id,
                  status: 'SUCCESS' as const,
                };
              }
            }

            return {
              idTemp: orderData.idTemp,
              status: 'ERROR' as const,
              error:
                err instanceof Error
                  ? err.message
                  : 'Error desconocido de persistencia',
            };
          }
        }),
      );

      // =========================================================
      // 7. CONSOLIDACIÓN
      // =========================================================

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            idTemp: 'UNKNOWN',
            status: 'ERROR',
            error: 'Promise execution failed unexpectedly',
          });
        }
      }
    }

    // =========================================================
    // 8. RESPUESTA FINAL
    // =========================================================

    return results;
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

  // En tu Servicio de Órdenes en el Backend
  async syncOfflineFields(
    orderId: string,
    data: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      deliveryStatus?: DeliveryStatus;
      updatedAt: string; // ISO String desde el Front
    },
  ) {
    const parsedDate = new Date(data.updatedAt);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Verificar existencia rápida
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });
      if (!currentOrder)
        throw new NotFoundException(`Orden ${orderId} no encontrada`);

      // 2. Mapear solo los campos que cambiaron offline
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
      if (data.deliveryStatus) updateData.deliveryStatus = data.deliveryStatus;

      // Forzamos la fecha de actualización histórica
      updateData.updatedAt = parsedDate;

      // 3. Actualización directa (Fuerza bruta consentida para el POS)
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        select: {
          id: true,
          idTemp: true,
        },
      });

      // 4. Inyectar los hechos en el historial respetando el momento real en que sucedieron
      if (data.status) {
        await tx.orderStateEvent.create({
          data: {
            orderId,
            stateType: 'ORDER',
            value: data.status,
            author: 'BUSINESS',
            createdAt: parsedDate,
          },
        });
      }
      if (data.paymentStatus) {
        await tx.orderStateEvent.create({
          data: {
            orderId,
            stateType: 'PAYMENT',
            value: data.paymentStatus,
            author: 'BUSINESS',
            createdAt: parsedDate,
          },
        });
      }
      if (data.deliveryStatus) {
        await tx.orderStateEvent.create({
          data: {
            orderId,
            stateType: 'DELIVERY',
            value: data.deliveryStatus,
            author: 'BUSINESS',
            createdAt: parsedDate,
          },
        });
      }

      return updatedOrder;
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
        if (!canChangeOrderStatus(currentOrder.status, newStatus)) {
          throw new Error(
            `Transición ilegal: de ${currentOrder.status} a ${newStatus}`,
          );
        }

        // 3. Si es válida, actualizamos
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });

        // 2. Registramos el hecho en la tabla de eventos
        await tx.orderStateEvent.create({
          data: {
            orderId: id,
            stateType: 'ORDER',
            value: newStatus,
            author: 'BUSINESS', // O el actor correspondiente
          },
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
      const result = await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            userId: true,
            businessId: true,
            deliveryCompanyId: true,
          },
        });

        if (!currentOrder)
          throw new NotFoundException(`Order ${orderId} not found`);

        // 1. Validar transición de pago
        if (
          !PAYMENT_TRANSITIONS[currentOrder.paymentStatus]?.includes(
            paymentStatus,
          )
        ) {
          throw new BadRequestException(
            `Transición de pago ilegal: ${currentOrder.paymentStatus} -> ${paymentStatus}`,
          );
        }

        // 2. Lógica de Reacción: ¿El pago afecta el estado de la orden?
        let nextOrderStatus = currentOrder.status;
        if (
          paymentStatus === PaymentStatus.CONFIRMED &&
          currentOrder.status === OrderStatus.PENDING
        ) {
          nextOrderStatus = OrderStatus.CONFIRMED;
        }

        // 3. Actualización Atómica
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus,
            status: nextOrderStatus,
          },
        });

        // 4. Registrar Eventos de Hecho
        await tx.orderStateEvent.create({
          data: { orderId, stateType: 'PAYMENT', value: paymentStatus },
        });

        if (nextOrderStatus !== currentOrder.status) {
          await tx.orderStateEvent.create({
            data: { orderId, stateType: 'ORDER', value: nextOrderStatus },
          });
        }

        return { updatedOrder, currentOrder };
      });

      const { updatedOrder } = result;

      if (updatedOrder.userId) {
        // 5. Notificar a los Gateways
        this.orderGateway.emitPaymentUpdated(
          updatedOrder.id,
          updatedOrder.paymentStatus,
          updatedOrder.paymentReceiptUrl || '',
          updatedOrder.userId,
          updatedOrder.businessId,
        );
      }

      return updatedOrder.paymentStatus;
    } catch (error) {
      this.logging.error('Error en updatePaymentStatus', {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateDeliveryStatus(id: string, newDeliveryStatus: DeliveryStatus) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            deliveryStatus: true,
            userId: true, // Puede ser null
            businessId: true,
            deliveryCompanyId: true,
          },
        });

        if (!currentOrder) throw new NotFoundException('Orden no encontrada');

        // 1. Permitimos saltos directos si el negocio lo decide
        // El negocio puede cancelar o despachar sin pasar por 'REQUESTED'
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            deliveryStatus: newDeliveryStatus,
            // Si el negocio pone "En camino", aseguramos que la orden no quede en "PENDING"
            status:
              newDeliveryStatus === DeliveryStatus.SHIPPED &&
              currentOrder.status === OrderStatus.PENDING
                ? OrderStatus.CONFIRMED
                : currentOrder.status,
          },
        });

        // 2. Registro del hecho
        await tx.orderStateEvent.create({
          data: {
            orderId: id,
            stateType: 'DELIVERY',
            value: newDeliveryStatus,
            author: 'BUSINESS',
          },
        });

        return updatedOrder;
      });

      // 3. Notificación condicional (Solo si hay usuario registrado)
      if (result.userId) {
        this.orderGateway.emitUserNotification({
          id: result.id,
          userId: result.userId,
          status: result.status,
          deliveryStatus: result.deliveryStatus,
          paymentStatus: result.paymentStatus,
        });
      }

      // 4. Notificación a la Mensajería (Si está asignada)
      // if (result.deliveryCompanyId) {
      //    this.orderGateway.emitToDeliveryCompany(result.deliveryCompanyId, result);
      // }

      return result.deliveryStatus;
    } catch (error) {
      this.logging.error('Error en updateDeliveryStatus', {
        orderId: id,
        error: error.message,
      });
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
    status: OrderStatus | DeliveryStatus;
    targetEntityType: TargetEntityType;
  }) {
    const shortOrderId = `#${order.id.slice(0, 6).toUpperCase()}`; // ID corto en mayúsculas

    let title: string = '';
    let message: string = '';
    let priority: NotificationPriority = 'LOW'; // Prioridad base
    let shouldNotify: boolean = true; // Renombrado de isSwitchCase a shouldNotify

    switch (order.status) {
      case OrderStatus.COMPLETED:
        title = '¡Listo para recoger!';
        message = `Tu pedido ${shortOrderId} te está esperando. ¡Pasa por aquí cuando quieras!`;
        priority = 'HIGH';
        break;

      case DeliveryStatus.SHIPPED:
        title = '¡Tu pedido está en camino!';
        message = `El repartidor va en camino con tu pedido ${shortOrderId}.`;
        priority = 'MEDIUM';
        break;

      case OrderStatus.CANCELLED:
        title = 'Pedido CANCELADO';
        message = `Lamentamos informarte que el negocio tuvo que cancelar tu pedido ${shortOrderId}. Revisa los detalles.`;
        priority = 'HIGH';
        break;

      case DeliveryStatus.CANCELLED:
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
