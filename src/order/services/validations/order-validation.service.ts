import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IMenuProductService } from 'src/menu-product/interfaces/menu-product-service.interface';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { CreateOrderFullDTO, CreateOrderItemDTO, CreateOrderOptionGroupDTO } from 'src/order/dtos/request/order.dto';

@Injectable()
export class OrderValidationService {
  constructor(
    @Inject(TOKENS.IMenuProductService)
    private readonly menuProductService: IMenuProductService,
    @Inject(TOKENS.IBusinessService)
    private readonly businessService: IBusinessService,
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

    await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.getMenuProductOrThrow(item.menuProductId);
        this.validateItemOptionGroups(product, item);
      }),
    );
  }

  private async getMenuProductOrThrow(menuProductId: string) {
    return await this.menuProductService.getMenuProductById(menuProductId);
  }

  private validateItemOptionGroups(
    product: {
      id: string;
      name: string;
      optionGroups: {
        id: string;
        name: string;
        options: { id: string; name: string }[];
      }[];
    },
    item: CreateOrderItemDTO,
  ) {
    const validGroupIds = new Set(product.optionGroups.map((g) => g.id));

    for (const group of item.optionGroups) {
      this.validateGroup(group, validGroupIds, product);
      const optionGroup = product.optionGroups.find(
        (g) => g.id === group.opcionGrupoId,
      );

      if (optionGroup) {
        this.validateOptions(group, optionGroup.options, product);
      }
    }
  }

  private validateGroup(
    group: CreateOrderOptionGroupDTO,
    validGroupIds: Set<string>,
    product: { name: string },
  ) {
    if (group.opcionGrupoId && !validGroupIds.has(group.opcionGrupoId)) {
      throw new BadRequestException(
        `El grupo de opciones ${group.opcionGrupoId} no pertenece al producto ${product.name}.`,
      );
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
