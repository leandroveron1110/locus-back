import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { ISeccionService } from '../interfaces/seccion-service.interface';
import {
  SeccionCreateDto,
  SeccionUpdateDto,
} from '../dtos/request/seccion.request.dto';
import { IMenuValidator } from '../interfaces/menu-service.interface';

@Injectable()
export class SeccionService implements ISeccionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IMenuValidator)
    private readonly menuValidator: IMenuValidator,
  ) {}

  public async createSeccion(dto: SeccionCreateDto) {
    await this.menuValidator.existMenuAndOwnerAndBusiness(
      dto.menuId,
      dto.ownerId,
      dto.businessId,
    );

    return this.prisma.seccion.create({
      data: {
        name: dto.name,
        index: dto.index,
        imageUrls: dto.imageUrls,
        menuId: dto.menuId,
      },
    });
  }

  public async findAllByMenuId(menuId: string) {
    return this.prisma.seccion.findMany({
      where: { menuId },
      orderBy: { index: 'asc' },
    });
  }

  public async findOne(id: string) {
    const seccion = await this.prisma.seccion.findUnique({ where: { id } });
    if (!seccion)
      throw new NotFoundException(`Sección con id '${id}' no encontrada`);
    return seccion;
  }

  public async updateSeccion(id: string, dto: Partial<SeccionUpdateDto>) {
    if (dto.menuId && dto.ownerId && dto.businessId) {
      await this.menuValidator.existMenuAndOwnerAndBusiness(
        dto.menuId,
        dto.ownerId,
        dto.businessId,
      );
    }

    const existing = await this.prisma.seccion.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException(`Sección con id '${id}' no encontrada`);

    return this.prisma.seccion.update({
      where: { id },
      data: {
        name: dto.name,
        index: dto.index,
        imageUrls: dto.imageUrls,
      },
    });
  }

  public async deleteSeccion(id: string) {
    const existing = await this.prisma.seccion.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException(`Sección con id '${id}' no encontrada`);

    return this.prisma.seccion.delete({ where: { id } });
  }
}
