import { DeliveryType, OrderStatus, PaymentMethodType, PaymentStatus } from "@prisma/client";

// DTO para la dirección
export interface AddressDto {
  id: string;
  street: string;
  number?: string | null;
  apartment?: string | null;
  city: string;
  province: string;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  enabled?: boolean;
  notes?: string | null;
}

// DTO para el usuario
export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarId?: string | null;
}

// DTO para opción de item
export interface OrderOptionDto {
  id: string;
  opcionId?: string | null;
  optionName: string;
  priceFinal: number;
  priceWithoutTaxes: number;
  taxesAmount: number;
  priceModifierType: string;
  quantity: number;
}

// DTO para grupo de opciones
export interface OrderOptionGroupDto {
  id: string;
  opcionGrupoId?: string | null;
  groupName: string;
  minQuantity: number;
  maxQuantity: number;
  quantityType: string;
  options: OrderOptionDto[];
}

// DTO para item de orden
export interface OrderItemDto {
  id: string;
  productName: string;
  productDescription?: string | null;
  productImageUrl?: string | null;
  quantity: number;
  priceAtPurchase: number;
  notes?: string | null;
  optionGroups: OrderOptionGroupDto[];
}

// DTO para descuentos
export interface OrderDiscountDto {
  id: string;
  amount: number;
  type: string;
  notes?: string | null;
  paidBy?: string | null;
}

// DTO principal de la orden
export interface OrderResponseDto {
  id: string;
  businessId: string;
  userId: string;
  deliveryCompanyId?: string | null;
  status: OrderStatus;
  origin: string;
  isTest: boolean;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryType: DeliveryType;
  paymentType: PaymentMethodType;
  paymentStatus: PaymentStatus;
  paymentReceiptUrl?: string | null;
  paymentInstructions?: string | null;
  paymentHolderName?: string | null;
  customerObservations?: string | null;
  businessObservations?: string | null;

  user: {
    id: string;
    fullName: string;
    phone: string;
    address?: string | null;
  };
  bussiness: {
    name: string;
    address: string;
    phone: string;
  };
  items: OrderItemDto[];
  discounts: OrderDiscountDto[];
}

// Mapper actualizado
export class OrderResponseDtoMapper {
  static fromPrisma(order: any): OrderResponseDto {
    return {
      id: order.id,
      businessId: order.businessId,
      userId: order.userId,
      deliveryCompanyId: order.deliveryCompanyId ?? null,
      status: order.status,
      origin: order.origin,
      isTest: order.isTest,
      total: Number(order.total),
      notes: order.notes ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveryType: order.deliveryType,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      paymentReceiptUrl: order.paymentReceiptUrl ?? null,
      paymentInstructions: order.paymentInstructions ?? null,
      paymentHolderName: order.paymentHolderName ?? null,
      customerObservations: order.customerObservations ?? null,
      businessObservations: order.businessObservations ?? null,
      user: {
        id: order.userId,
        fullName: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress ?? null,
      },
      bussiness: {
        name: order.businessName,
        address: order.businessAddress,
        phone: order.businessPhone,
      },
      items: order.OrderItem.map((item: any) => ({
        id: item.id,
        productName: item.productName,
        productDescription: item.productDescription ?? null,
        productImageUrl: item.productImageUrl ?? null,
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
        notes: item.notes ?? null,
        optionGroups: item.optionGroups.map((group: any) => ({
          id: group.id,
          opcionGrupoId: group.opcionGrupoId ?? null,
          groupName: group.groupName,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          quantityType: group.quantityType,
          options: group.options.map((option: any) => ({
            id: option.id,
            opcionId: option.opcionId ?? null,
            optionName: option.optionName,
            priceFinal: Number(option.priceFinal),
            priceWithoutTaxes: Number(option.priceWithoutTaxes),
            taxesAmount: Number(option.taxesAmount),
            priceModifierType: option.priceModifierType,
            quantity: option.quantity,
          })),
        })),
      })),
      discounts: order.OrderDiscount.map((discount: any) => ({
        id: discount.id,
        amount: Number(discount.amount),
        type: discount.type,
        notes: discount.notes ?? null,
        paidBy: discount.paidBy ?? null,
      })),
    };
  }
}
