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
} from '@prisma/client';
import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
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
  ) {
    this.logging.setContext(OrderCommandService.name);
    this.logging.setService('OrderModule');
  }

  async updatePayment(
    orderId: string,
    data: {
      paymentType?: PaymentMethodType;
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
      data.paymentType === PaymentMethodType.TRANSFER &&
      !data.paymentHolderName &&
      !data.paymentReceiptUrl
    ) {
      this.logging.warn(
        'Validación fallida: Nombre de titular y recibo requeridos para transferencia.',
        {
          orderId,
          paymentType: data.paymentType,
        },
      );
      throw new BadRequestException(
        'El nombre del titular es obligatorio para transferencias',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentType: data.paymentType ?? order.paymentType,
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
      this.orderGateway.emitNewOrderNotification(fullOrder)
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
      paymentType: updatedOrder.paymentType,
    });

    return updatedOrder.paymentType;
  }

  async create(dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        ...dto,
        total: new Prisma.Decimal(dto.total),
        status: OrderStatus.PENDING,
        origin: OrderOrigin.WEB,
      },
    });
  }

  async createFullOrder(dto: CreateOrderFullDTO): Promise<Order> {
    this.logging.log('Iniciando creación de orden completa (Full Order).', {
      userId: dto.userId,
      businessId: dto.businessId,
    }); // 👈 Log de inicio
    try {
      await this.orderValidation.validateCreateFullOrder(dto);
      this.logging.debug('Validación de Full Order completada.', {
        userId: dto.userId,
      });

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
      this.orderGateway.emitNewOrderNotification(fullOrder)
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

  async update(id: string, dto: UpdateOrderDTO) {
    return this.prisma.order.update({ where: { id }, data: dto });
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

      this.orderGateway.emitUserNotification({
        id: updatedOrder.id,
        status: updatedOrder.status,
        total: `${updatedOrder.total}`,
        userId: updatedOrder.userId,
        createdAt: `${updatedOrder.createdAt}`
      })

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
}
