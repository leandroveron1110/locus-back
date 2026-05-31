import { DeliveryStatus, DeliveryType, OrderOrigin, OrderStatus, PaymentMethodType, PaymentStatus } from "@prisma/client";

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


export interface OrderResponseDto {
  id: string;
  idTemp: string;
  businessId: string;
  userId: string;
  deliveryAddressId?: string | null;
  pickupAddressId?: string | null;
  deliveryCompanyId?: string | null;
  status: OrderStatus;
  total: number;
  totalDeliveryCost: number,
  
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryType: DeliveryType;
  deliveryStatus: DeliveryStatus;
  orderPaymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  paymentReceiptUrl?: string | null;
  paymentInstructions?: string | null;
  paymentHolderName?: string | null;
  customerObservations?: string | null;
  businessObservations?: string | null;
  origin: OrderOrigin
  shortCode?: string | null;
  dailyNumber?: number | null;

  // 📌 Snapshots
  user: {
    id: string;
    fullName: string;
    phone: string;
    address?: string | null;
  };

  bussiness: {
    name: string;
    address: string; // dirección completa como string
  }


  items: OrderItemDto[];
}


// Mapper actualizado
export class OrderResponseDtoMapper {
  static fromPrisma(order: any): OrderResponseDto {
    return {
      id: order.id,
      idTemp: order.idTemp,
      businessId: order.businessId,
      userId: order.userId,
      deliveryAddressId: order.deliveryAddressId ?? null,
      pickupAddressId: order.pickupAddressId ?? null,
      deliveryCompanyId: order.deliveryCompanyId ?? null,

      shortCode: order.shortCode ?? null,
      dailyNumber: order.dailyNumber ?? null,

      status: order.status,
      total: Number(order.total),
      totalDeliveryCost: Number(order.totalDeliveryCost),
      notes: order.notes ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveryType: order.deliveryType,
      deliveryStatus: order.deliveryStatus,
      orderPaymentMethod: order.orderPaymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReceiptUrl: order.paymentReceiptUrl ?? null,
      paymentInstructions: order.paymentInstructions ?? null,
      paymentHolderName: order.paymentHolderName ?? null,
      customerObservations: order.customerObservations ?? null,
      businessObservations: order.businessObservations ?? null,
      origin: order.origin,

      user: {
        id: order.userId,
        fullName: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress ?? null,
      },
      bussiness: {
        address: order.businessAddress,
        name: order.businessName
      },

      items: order.OrderItem.map((item: any) => ({
        id: item.id,
        productName: item.productName,
        productDescription: item.productDescription ?? null,
        productPaymentMethod: item.productPaymentMethod,
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
            priceModifierType: option.priceModifierType,
            quantity: option.quantity,
          })),
        })),
      })),
    };
  }
}



export interface IOrderDtoResponse {
  id: string;
  userId: string;
  createdAt: string;
  total: number;
  deliveryType: DeliveryType;
  orderPaymentMethod: PaymentMethodType;
  status: OrderStatus;
  customerName: string;
}
