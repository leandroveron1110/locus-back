// order-preview.dto.ts

type PrismaOrder = any; // reemplazar con el tipo real si lo tenés

export class UserPreviewDto {
  id!: string;
  name!: string;
  email!: string;

  static fromPrisma(user: any): UserPreviewDto {
    const dto = new UserPreviewDto();
    dto.id = user.id;
    dto.name = `${user.firstName} ${user.lastName}`;
    dto.email = user.email;
    return dto;
  }
}

export class AddressPreviewDto {
  street!: string;
  city!: string;
  province!: string;

  static fromPrisma(address: any): AddressPreviewDto | undefined {
    if (!address) return undefined;
    const dto = new AddressPreviewDto();
    dto.street = address.street;
    dto.city = address.city;
    dto.province = address.province;
    return dto;
  }
}

export class OrderItemPreviewDto {
  product!: string;
  quantity!: number;
  price!: string;
  options!: string[];

  static fromPrisma(item: any): OrderItemPreviewDto {
    const dto = new OrderItemPreviewDto();
    dto.product = item.productName;
    dto.quantity = item.quantity;
    dto.price = item.priceAtPurchase;
    dto.options = (item.optionGroups ?? [])
      .flatMap((group: any) => group.options ?? [])
      .map((option: any) => option.optionName);
    return dto;
  }
}

export class OrderPreviewDto {
  id: string;
  status: string;
  total: number;
  notes: string | null;
  origin: string;

  user: {
    id: string;
    name: string;
    email: string;
  };

  pickupAddress: {
    street: string;
    city: string;
    province: string;
  } | null;

  deliveryAddress: {
    street: string;
    city: string;
    province: string;
  } | null;

  items: {
    productId: string;
    product: string;
    quantity: number;
    price: number;
    options: {
      optionId: string;
      name: string;
      priceFinal: number;
      quantity: number
    }[];
  }[];

  static fromPrisma(order: any): OrderPreviewDto {
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      notes: order.notes,
      origin: order.origin,
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      pickupAddress: order.pickupAddress
        ? {
            street: order.pickupAddress.street,
            city: order.pickupAddress.city,
            province: order.pickupAddress.province,
          }
        : null,
      deliveryAddress: order.deliveryAddress
        ? {
            street: order.deliveryAddress.street,
            city: order.deliveryAddress.city,
            province: order.deliveryAddress.province,
          }
        : null,
      items: order.OrderItem.map((item: any) => ({
        productId: item.productId,
        product: item.productName,
        quantity: item.quantity,
        price: item.price,
        options: item.optionGroups.flatMap((group: any) =>
          group.options.map((opt: any) => ({
            optionId: opt.id,
            name: opt.optionName,
            priceFinal: opt.priceFinal,
            quantity: opt.quantity
          }))
        ),
      })),
    };
  }
}

