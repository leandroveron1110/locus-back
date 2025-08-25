// src/business-payment-methods/business-payment-methods.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Asegúrate de que esta ruta sea correcta
import { CreateBusinessPaymentMethodDto } from '../dtos/request/create-business-payment-method.dto';
import { UpdateBusinessPaymentMethodDto } from '../dtos/request/update-business-payment-method.dto';


@Injectable()
export class BusinessPaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBusinessPaymentMethodDto) {
    // Aquí puedes añadir validaciones adicionales si lo necesitas
    return this.prisma.businessPaymentMethod.create({
      data: createDto,
    });
  }

  async findAllByBusiness(businessId: string) {
    return this.prisma.businessPaymentMethod.findMany({
      where: { businessId, isActive: true },
    });
  }

  async findOne(id: string) {
    const method = await this.prisma.businessPaymentMethod.findUnique({
      where: { id },
    });
    if (!method) {
      throw new NotFoundException(`Payment method with ID ${id} not found.`);
    }
    return method;
  }

  async update(id: string, updateDto: UpdateBusinessPaymentMethodDto) {
    await this.findOne(id); // Verifica que el método de pago exista
    return this.prisma.businessPaymentMethod.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica que el método de pago exista
    return this.prisma.businessPaymentMethod.delete({
      where: { id },
    });
  }
}