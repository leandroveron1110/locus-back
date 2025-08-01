import { Decimal } from '@prisma/client/runtime/library';
import { MenuProduct } from '@prisma/client';

import { Opcion } from '@prisma/client';

import { OpcionGrupo } from '@prisma/client';

export class MenuProductDto {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  finalPrice: string;
  originalPrice?: string;
  currency: string;
  currencyMask: string;
  finalPriceWithoutTaxes?: string;
  taxesAmount?: string;
  discountAmount?: string;
  discountPercentage?: string;
  discountType: string[];
  rating: number;
  hasOptions: boolean;
  isMostOrdered: boolean;
  isRecommended: boolean;
  seccionId: string;
  optionGroups: OptionGroupDto[];
  images: string[];

  static fromPrisma(
    product: MenuProduct & { optionGroups: any[]; menuProductImages: any[] },
  ): MenuProductDto {
    const dto = new MenuProductDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.enabled = product.enabled;
    dto.finalPrice = product.finalPrice.toString();
    dto.originalPrice = product.originalPrice?.toString();
    dto.currency = product.currency;
    dto.currencyMask = product.currencyMask;
    dto.finalPriceWithoutTaxes = product.finalPriceWithoutTaxes?.toString();
    dto.taxesAmount = product.taxesAmount?.toString();
    dto.discountAmount = product.discountAmount?.toString();
    dto.discountPercentage = product.discountPercentage?.toString();
    dto.discountType = product.discountType;
    dto.rating = product.rating;
    dto.hasOptions = product.hasOptions;
    dto.isMostOrdered = product.isMostOrdered;
    dto.isRecommended = product.isRecommended;
    dto.seccionId = product.seccionId;
    dto.optionGroups = OptionGroupDto.fromPrismaMany(product.optionGroups);
    dto.images = product.menuProductImages.map((img) => img.url);
    return dto;
  }

  static fromPrismaMany(
    products: (MenuProduct & { optionGroups: any[] })[],
  ): MenuProductDto[] {
    return products.map(MenuProductDto.fromPrisma);
  }
}

export class OptionGroupDto {
  id: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  quantityType: string;
  options: OptionDto[];

  static fromPrisma(group: OpcionGrupo & { options: any[] }): OptionGroupDto {
    const dto = new OptionGroupDto();
    dto.id = group.id;
    dto.name = group.name;
    dto.minQuantity = group.minQuantity;
    dto.maxQuantity = group.maxQuantity;
    dto.quantityType = group.quantityType;
    dto.options = OptionDto.fromPrismaMany(group.options);
    return dto;
  }

  static fromPrismaMany(
    groups: (OpcionGrupo & { options: any[] })[],
  ): OptionGroupDto[] {
    return groups.map(OptionGroupDto.fromPrisma);
  }
}

export class OptionDto {
  id: string;
  legacyId?: number;
  name: string;
  hasStock: boolean;
  index: number;
  priceFinal: string;
  priceWithoutTaxes: string;
  taxesAmount: string;
  priceModifierType: string;
  maxQuantity?: number;
  images: string[];

  static fromPrisma(option: Opcion & { optionImages?: any[] }): OptionDto {
    const dto = new OptionDto();
    dto.id = option.id;
    dto.legacyId = option.legacyId ?? undefined;
    dto.name = option.name;
    dto.hasStock = option.hasStock;
    dto.index = option.index;
    dto.priceFinal = option.priceFinal.toString();
    dto.priceWithoutTaxes = option.priceWithoutTaxes.toString();
    dto.taxesAmount = option.taxesAmount.toString();
    dto.priceModifierType = option.priceModifierType;
    dto.maxQuantity = option.maxQuantity ?? undefined;
    dto.images =
      option.optionImages?.map((img) => img.url) || [];
    return dto;
  }

  static fromPrismaMany(options: Opcion[]): OptionDto[] {
    return options.map(OptionDto.fromPrisma);
  }
}
