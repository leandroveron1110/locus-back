import { PrismaClient, MenuProduct } from '@prisma/client';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISeccionValidator } from 'src/menu/interfaces/seccion-service.interface';
import { IMenuProductService } from '../interfaces/menu-product-service.interface';

@Injectable()
export class MenuProductService implements IMenuProductService{
  constructor(
    private readonly prisma: PrismaClient,

    @Inject(TOKENS.ISeccionValidator)
    private readonly seccionValidatorService: ISeccionValidator,
  ) {}

  async create(
    seccionId: string,
    menuId: string,
    ownerId: string,
    businessId: string,
    dto: CreateMenuProductDto,
  ): Promise<MenuProduct> {
    // Verifica que la sección, menú, dueño y negocio existen y están vinculados
    await this.seccionValidatorService.existSeccionAndMenuAndOwnerAndBusiness(
      seccionId,
      menuId,
      ownerId,
      businessId,
    );

    return this.prisma.menuProduct.create({
      data: {
        ...dto,
        enabled: dto.enabled ?? true,
        isCustomizedImage: dto.isCustomizedImage ?? false,
        hasOptions: dto.hasOptions ?? false,
        isMostOrdered: dto.isMostOrdered ?? false,
        isRecommended: dto.isRecommended ?? false,
        seccionId: seccionId,
      },
    });
  }

  async findAll(): Promise<MenuProduct[]> {
    return this.prisma.menuProduct.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findAllBySeccion(seccionId: string): Promise<MenuProduct[]> {
    return this.prisma.menuProduct.findMany({
      where: {
        seccionId: seccionId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<MenuProduct> {
    const product = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Menu product not found');
    return product;
  }

  async update(
    id: string,
    dto: Partial<CreateMenuProductDto>,
  ): Promise<MenuProduct> {
    // Asegurarse de que existe antes de actualizar
    const exists = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Menu product not found');

    return this.prisma.menuProduct.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async remove(id: string): Promise<MenuProduct> {
    const exists = await this.prisma.menuProduct.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Menu product not found');

    return this.prisma.menuProduct.delete({ where: { id } });
  }
}
