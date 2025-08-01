// src/option/option.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOpcionDto } from '../dtos/request/opcion-request.dto';

@Injectable()
export class OptionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOpcionDto) {
    const existOptionGroup = await this.prisma.opcionGrupo.count({
      where: { id: dto.optionGroupId },
    });
    if (!existOptionGroup) {
      throw new NotFoundException(
        `No existe el option-group con el ID: ${dto.optionGroupId}`,
      );
    }
    return await this.prisma.opcion.create({
      data: {
        name: dto.name,
        hasStock: dto.hasStock,
        index: dto.index,
        priceFinal: new Decimal(dto.priceFinal),
        priceWithoutTaxes: new Decimal(dto.priceWithoutTaxes),
        taxesAmount: new Decimal(dto.taxesAmount),
        priceModifierType: dto.priceModifierType,
        maxQuantity: dto.maxQuantity,
        optionGroupId: dto.optionGroupId,
      },
    });
  }

  async findAllByGroup(optionGroupId: string) {
    return this.prisma.opcion.findMany({
      where: { optionGroupId },
      orderBy: { index: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.opcion.delete({ where: { id } });
  }
}
