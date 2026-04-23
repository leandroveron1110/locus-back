import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../dtos/request/address.dto';
import { AddressIndexingService } from 'src/delivery-zones/services/address-indexing.service';

@Injectable()
export class AddressService {
  constructor(
    private prisma: PrismaService,
    private addressIndexingService: AddressIndexingService,
  ) {}

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
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      select: {
        id: true,
        street: true,
        number: true,
        city: true,
        latitude: true,
        longitude: true,
        notes: true,
      },
    });
    const dtos = addresses.map((addr) => {
      return {
        id: addr.id,
        address: `${addr.street} ${addr.number} ${addr.city}`,
        latitude: addr.latitude,
        longitude: addr.longitude,
        notes: addr.notes || undefined, // Placeholder, puedes agregar un campo de notas si lo deseas
      };
    });

    return dtos;
  }

  async findAllByBusiness(businessId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { businessId },
      select: {
        id: true,
        street: true,
        number: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    });
    return addresses;
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
