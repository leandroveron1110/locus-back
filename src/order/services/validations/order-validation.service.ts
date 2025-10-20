import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IBusinessQueryService } from 'src/business/interfaces/business.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IMenuProductService } from 'src/menu-product/interfaces/menu-product-service.interface';
import {
  CreateOrderFullDTO,
  CreateOrderItemDTO,
  CreateOrderOptionGroupDTO,
} from 'src/order/dtos/request/order.dto';
import { IOrderValidationService } from 'src/order/interfaces/order-service.interface';

@Injectable()
export class OrderValidationService implements IOrderValidationService {
  constructor(
    @Inject(TOKENS.IMenuProductService)
    private readonly menuProductService: IMenuProductService,
    @Inject(TOKENS.IBusinessQueryService)
    private readonly businessService: IBusinessQueryService,
  ) {}

  async validateCreateFullOrder(dto: CreateOrderFullDTO): Promise<void> {
    const moduleConfig =
      await this.businessService.getModulesConfigByBusinessId(dto.businessId);

    if (!moduleConfig.menu) {
      throw new BadRequestException(
        'El módulo de menú no está configurado para este negocio.',
      );
    }
    if (!moduleConfig.menu.enabled) {
      throw new BadRequestException(
        'El menú está desactivado para este negocio.',
      );
    }

    const productIds = dto.items.map((item) => item.menuProductId);
    const products =
      await this.menuProductService.getMenuProductsByIds(productIds);

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.menuProductId);
      if (!product) {
        throw new BadRequestException(
          `El producto ${item.menuProductId} no existe.`,
        );
      }
      this.validateItemOptionGroups(product, item);
    }
  }

  private validateItemOptionGroups(
    product: {
      id: string;
      name: string;
      optionGroups: {
        id: string;
        name: string;
        options: { id: string; name: string }[];
        // minQuantity: number;
        // maxQuantity: number;
      }[];
    },
    item: CreateOrderItemDTO,
  ) {
    const validGroups = new Map(product.optionGroups.map((g) => [g.id, g]));

    for (const group of item.optionGroups) {
      // Validar existencia del grupo
      if (group.opcionGrupoId && !validGroups.has(group.opcionGrupoId)) {
        throw new BadRequestException(
          `El grupo de opciones ${group.opcionGrupoId} no pertenece al producto ${product.name}.`,
        );
      }

      const optionGroup = group.opcionGrupoId
        ? validGroups.get(group.opcionGrupoId)
        : undefined;
      if (optionGroup) {
        // Validar opciones
        this.validateOptions(group, optionGroup.options, product);

        // Validar cantidad seleccionada vs min y max
        const totalQuantity = group.options.reduce(
          (sum, o) => sum + o.quantity,
          0,
        );
        // if (totalQuantity < optionGroup.minQuantity) {
        //   throw new BadRequestException(
        //     `El grupo de opciones ${optionGroup.name} del producto ${product.name} requiere al menos ${optionGroup.minQuantity} opción(es).`,
        //   );
        // }
        // if (totalQuantity > optionGroup.maxQuantity) {
        //   throw new BadRequestException(
        //     `El grupo de opciones ${optionGroup.name} del producto ${product.name} permite un máximo de ${optionGroup.maxQuantity} opción(es).`,
        //   );
        // }
      }
    }
  }

  private validateOptions(
    group: CreateOrderOptionGroupDTO,
    validOptions: { id: string; name: string }[],
    product: { name: string },
  ) {
    const validOptionIds = new Set(validOptions.map((o) => o.id));

    for (const option of group.options) {
      if (option.opcionId && !validOptionIds.has(option.opcionId)) {
        throw new BadRequestException(
          `La opción ${option.opcionId} no pertenece al grupo ${group.opcionGrupoId} del producto ${product.name}.`,
        );
      }
    }
  }
}
