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
  isDefault: boolean;
  enabled: boolean;
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
  deliveryCompanyId: string;
  status: string;
  origin: string;
  isTest: boolean;
  total: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserDto;
  pickupAddress?: AddressDto | null;
  deliveryAddress?: AddressDto | null;
  items: OrderItemDto[];
  discounts: OrderDiscountDto[];
}

export class OrderResponseDtoMapper {
  static fromPrisma(order: any): OrderResponseDto {
    return {
      id: order.id,
      businessId: order.businessId,
      status: order.status,
      deliveryCompanyId:  order.deliveryCompanyId,
      origin: order.origin,
      isTest: order.isTest,
      userId: order.userId,
      total: Number(order.total),
      notes: order.notes ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: {
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        avatarId: order.user.avatarId ?? null,
      },
      pickupAddress: order.pickupAddress ? {
        id: order.pickupAddress.id,
        street: order.pickupAddress.street,
        number: order.pickupAddress.number ?? null,
        apartment: order.pickupAddress.apartment ?? null,
        city: order.pickupAddress.city,
        province: order.pickupAddress.province,
        country: order.pickupAddress.country,
        postalCode: order.pickupAddress.postalCode ?? null,
        latitude: order.pickupAddress.latitude ? Number(order.pickupAddress.latitude) : null,
        longitude: order.pickupAddress.longitude ? Number(order.pickupAddress.longitude) : null,
        isDefault: order.pickupAddress.isDefault,
        enabled: order.pickupAddress.enabled,
        notes: order.pickupAddress.notes ?? null,
      } : null,
      deliveryAddress: order.deliveryAddress ? {
        id: order.deliveryAddress.id,
        street: order.deliveryAddress.street,
        number: order.deliveryAddress.number ?? null,
        apartment: order.deliveryAddress.apartment ?? null,
        city: order.deliveryAddress.city,
        province: order.deliveryAddress.province,
        country: order.deliveryAddress.country,
        postalCode: order.deliveryAddress.postalCode ?? null,
        latitude: order.deliveryAddress.latitude ? Number(order.deliveryAddress.latitude) : null,
        longitude: order.deliveryAddress.longitude ? Number(order.deliveryAddress.longitude) : null,
        isDefault: order.deliveryAddress.isDefault,
        enabled: order.deliveryAddress.enabled,
        notes: order.deliveryAddress.notes ?? null,
      } : null,
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
