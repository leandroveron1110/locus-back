// src/option/option.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOpcionDto } from '../dtos/request/opcion-request.dto';

@Injectable()
export class OptionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOpcionDto) {
    console.log(dto)
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

  async deleteMany(ids: string[]) {
    return this.prisma.opcion.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async update(optionId: string, dto: Partial<CreateOpcionDto>) {
    // Validar que la opción exista
    const existOption = await this.prisma.opcion.findUnique({
      where: { id: optionId },
    });
    if (!existOption) {
      throw new NotFoundException(`No existe la opción con el ID: ${optionId}`);
    }

    // Si cambia el optionGroupId, validar que el grupo exista
    if (dto.optionGroupId) {
      const existOptionGroup = await this.prisma.opcionGrupo.findUnique({
        where: { id: dto.optionGroupId },
        select: {id: true}
      });
      if (!existOptionGroup) {
        throw new NotFoundException(
          `No existe el option-group con el ID: ${dto.optionGroupId}`,
        );
      }
    }

    return this.prisma.opcion.update({
      where: { id: optionId },
      data: {
        name: dto.name ?? existOption.name,
        hasStock: dto.hasStock ?? existOption.hasStock,
        index: dto.index ?? existOption.index,
        priceFinal: dto.priceFinal
          ? new Decimal(dto.priceFinal)
          : existOption.priceFinal,
        priceWithoutTaxes: dto.priceWithoutTaxes
          ? new Decimal(dto.priceWithoutTaxes)
          : existOption.priceWithoutTaxes,
        taxesAmount: dto.taxesAmount
          ? new Decimal(dto.taxesAmount)
          : existOption.taxesAmount,
        priceModifierType:
          dto.priceModifierType ?? existOption.priceModifierType,
        maxQuantity: dto.maxQuantity ?? existOption.maxQuantity,
        optionGroupId: dto.optionGroupId ?? existOption.optionGroupId,
      },
    });
  }
}
