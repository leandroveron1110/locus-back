import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TOKENS } from "src/common/constants/tokens";
import { IMenuValidator } from "src/menu/interfaces/menu-service.interface";
import { ISeccionValidator } from "src/menu/interfaces/seccion-service.interface";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class SeccionValidatorService implements ISeccionValidator{
constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IMenuValidator)
    private readonly menuValidator: IMenuValidator,
  ) {}

  async existSeccionAndMenuAndOwnerAndBusiness(
    seccionId: string,
    menuId: string,
    ownerId: string,
    businessId: string,
  ): Promise<void> {
    await Promise.all([
      this.menuValidator.existMenuAndOwnerAndBusiness(menuId, ownerId, businessId ),
      this.checkOne(seccionId)

    ])
  }
  async checkOne(id: string): Promise<void> {
    const count = await this.prisma.seccion.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException(`seccion con ID ${id} no encontrado.`);
    }
  }

  async checkMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const count = await this.prisma.seccion.count({
      where: { id: { in: ids } },
    });

    if (count !== ids.length) {
      throw new NotFoundException('Uno o más seccion no existen.');
    }
  }
}