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
import { OrderResponseDtoMapper } from 'src/order/dtos/response/order-response.dto';
import {
  IOrderCreationService,
  IOrderDeleteService,
  IOrderQueryService,
  IOrderUpdateService,
  IOrderValidationService,
} from 'src/order/interfaces/order-service.interface';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { TOKENS } from 'src/common/constants/tokens';

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
  ) {}

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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    // Validaciones básicas
    if (
      data.paymentType === PaymentMethodType.TRANSFER &&
      !data.paymentHolderName &&
      !data.paymentReceiptUrl
    ) {
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

    this.orderGateway.emitPaymentUpdated(
      updatedOrder.id,
      updatedOrder.paymentStatus,
      data.paymentReceiptUrl || '',
      updatedOrder.userId,
      updatedOrder.businessId,
    );

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

  // ... (mismos imports y Schemas Zod)

  async createFullOrder(dto: CreateOrderFullDTO): Promise<Order> {
    await this.orderValidation.validateCreateFullOrder(dto);

    // 1. Reestructurar los datos para el formato de Nested Writes de Prisma
    const { items, pickupAddressId, deliveryAddressId, ...baseOrderData } = dto;

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
        }
      });

      // Retornamos el objeto Order recién creado
      return order;
    });

    // 3. Obtener la orden completa y emitir el evento (si fuera necesario)
    // Nota: Si usaste 'include' en el paso 2, podrías usar directamente el 'createdOrder'
    const fullOrder = await this.orderQueryService.findOne(createdOrder.id)
    this.orderGateway.emitNewOrder(fullOrder);

    // 4. Devolver la orden
    return createdOrder;
  }

  async update(id: string, dto: UpdateOrderDTO) {
    return this.prisma.order.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: OrderStatus) {
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

    return updatedOrder.status;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<PaymentStatus> {
    try {
      // 1. Validar la existencia y estado actual de la orden
      const currentOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true
        }
      });

      if (!currentOrder) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      const validInitialStates: PaymentStatus[] = [
        PaymentStatus.PENDING,
        PaymentStatus.IN_PROGRESS,
      ];
      if (!validInitialStates.includes(currentOrder.paymentStatus)) {
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

      // 3. Actualizar la orden de forma atómica
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: paymentStatus,
          status: newOrderStatus,
        },
      });

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

      return updatedOrder.paymentStatus;
    } catch (error) {
      // Relanzar el error o devolver un mensaje amigable
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error processing payment status update.',
      );
    }
  }

  async remove(id: string) {
    return this.prisma.order.delete({ where: { id } });
  }
}
