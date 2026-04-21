import { PrismaClient } from "@prisma/client";
import { CreateOrderSchema } from "src/order/dtos/request/order.dto";

const prisma = new PrismaClient();

export class OrderBuilderService {
  async build(dto: unknown) {
    // 1. VALIDAR DTO
    const data = CreateOrderSchema.parse(dto);

    // 2. TRAER TODO DE UNA
    const [products, business, address, deliveryCompany] =
      await Promise.all([
        prisma.menuProduct.findMany({
          where: {
            id: {
              in: data.items.map((i) => i.menuProductId),
            },
          },
          include: {
            optionGroups: {
              include: {
                options: true,
              },
            },
          },
        }),

        prisma.business.findUnique({
          where: { id: data.businessId },
        }),

        data.deliveryAddressId
          ? prisma.address.findUnique({
              where: { id: data.deliveryAddressId },
            })
          : null,

        data.deliveryCompanyId
          ? prisma.deliveryCompany.findUnique({
              where: { id: data.deliveryCompanyId },
            })
          : null,
      ]);

    // 3. VALIDACIONES
    if (!business) throw new Error("Negocio no encontrado");

    // validamos los usarios antes de seguir, para obtimizar el proceso y no hacer todo para nada
    if (!data.userId) throw new Error("Usuario no encontrado");
    

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. ARMAR ITEMS
    const orderItems: any[] = [];
    let total = 0;
    // Creamos el producto
    for (const item of data.items) {
      const product = productMap.get(item.menuProductId);

      if (!product) {
        throw new Error(`Producto ${item.menuProductId} no existe`);
      }

      let itemTotal = Number(product.finalPrice);

      const optionGroups: any[] = [];

      for (const groupDto of item.optionGroups || []) {
        const group = product.optionGroups.find(
          (g) => g.id === groupDto.opcionGrupoId
        );

        if (!group) {
          throw new Error("Grupo inválido");
        }

        const options: any[] = [];

        for (const optDto of groupDto.options) {
          const option = group.options.find(
            (o) => o.id === optDto.opcionId
          );

          if (!option) {
            throw new Error("Opción inválida");
          }

          const optionPrice = Number(option.priceFinal) * optDto.quantity;

          itemTotal += optionPrice;

          options.push({
            opcionId: option.id,
            optionName: option.name,
            priceFinal: option.priceFinal,
            priceWithoutTaxes: option.priceWithoutTaxes,
            taxesAmount: option.taxesAmount,
            priceModifierType: option.priceModifierType,
            quantity: optDto.quantity,
          });
        }

        optionGroups.push({
          opcionGrupoId: group.id,
          groupName: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          quantityType: group.quantityType,
          options,
        });
      }

      total += itemTotal * item.quantity;

      orderItems.push({
        menuProductId: product.id,
        productName: product.name,
        productDescription: product.description,
        productImageUrl: product.imageUrl,
        productPaymentMethod: data.orderPaymentMethod,
        quantity: item.quantity,
        priceAtPurchase: product.finalPrice,
        notes: data.notes,
        optionGroups,
      });
    }

    // 5. DELIVERY
    let totalDeliveryCost = 0;

    if (data.deliveryType === "DELIVERY") {
      if (!deliveryCompany) throw new Error("Delivery requerido");

      // 👇 esto después lo podés mejorar con zonas
      totalDeliveryCost = 0;
    }

    // 6. SNAPSHOTS
    const orderData = {
      userId: data.userId,
      businessId: business.id,

      deliveryAddressId: data.deliveryAddressId,
      pickupAddressId: data.pickupAddressId,
      deliveryCompanyId: deliveryCompany?.id,

      customerName: "TODO", // 👈 sacar del usuario
      customerPhone: "TODO",
      customerAddress: address?.street,

      businessName: business.name,
      businessPhone: business.phone,
      businessAddress: business.address,

      deliveryCompanyName: deliveryCompany?.name,
      deliveryCompanyPhone: deliveryCompany?.phone,

      total,
      totalDeliveryCost,

      orderPaymentMethod: data.orderPaymentMethod,
      deliveryType: data.deliveryType,

      notes: data.notes,

      items: orderItems,
    };

    return orderData;
  }
}