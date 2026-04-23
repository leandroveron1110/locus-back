import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../dtos/request/address.dto';
import { AddressIndexingService } from 'src/delivery-zones/services/address-indexing.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService, private addressIndexingService: AddressIndexingService) {}

  async create(data: CreateAddressDto) {
    const address = await this.prisma.address.create({ data });
    await this.addressIndexingService.updateAddressIndex(
      address.id,
      Number(address.latitude),
      Number(address.longitude),
    );
    return address;
  }

  async findAll() {
    return await this.prisma.address.findMany();
  }
  async findAllByUser(userId: string) {
    return await this.prisma.address.findMany({ where: { userId } });
  }

  async findAllByBusiness(businessId: string) {
    return await this.prisma.address.findMany({ where: { businessId } });
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    return address;
  }

  async update(id: string, data: UpdateAddressDto) {
    return await this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return await this.prisma.address.delete({ where: { id } });
  }
}
