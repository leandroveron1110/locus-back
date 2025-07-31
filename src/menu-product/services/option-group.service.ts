import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, OpcionGrupo } from '@prisma/client';
import { CreateOptionGroupDto, UpdateOptionGroupDto } from '../dtos/request/option-group-request.dto';

@Injectable()
export class OptionGroupService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreateOptionGroupDto): Promise<OpcionGrupo> {
    return this.prisma.opcionGrupo.create({ data: dto });
  }

  async findAll(): Promise<OpcionGrupo[]> {
    return this.prisma.opcionGrupo.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findByMenuProduct(menuProductId: string): Promise<OpcionGrupo[]> {
    return this.prisma.opcionGrupo.findMany({
      where: { menuProductId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<OpcionGrupo> {
    const group = await this.prisma.opcionGrupo.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Option group not found');
    return group;
  }

  async update(id: string, dto: UpdateOptionGroupDto): Promise<OpcionGrupo> {
    await this.findOne(id);
    return this.prisma.opcionGrupo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<OpcionGrupo> {
    await this.findOne(id);
    return this.prisma.opcionGrupo.delete({ where: { id } });
  }
}
