import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from '../dtos/request/delivery-company.dto';
import { IDeliveryService } from '../interfaces/delivery-service.interface';
import { OrderStatus, UserRole } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IOrderGateway } from 'src/order/interfaces/order-gateway.interface';
import { IOrderQueryService } from 'src/order/interfaces/order-service.interface';

@Injectable()
export class DeliveryService implements IDeliveryService{
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IOrderGateway)
    private orderGateway: IOrderGateway,
    @Inject(TOKENS.IOrderQueryService)
    private orderQueryService: IOrderQueryService,
  ) {}

  // ----------- Compañías -----------
  async createCompany(data: CreateDeliveryCompanyDto) {
    data.isActive = true;
    const owner = await this.prisma.user.findUnique({where: {id: data.ownerId}, select: {id: true}});
    if(owner) {
      return await this.prisma.deliveryCompany.create({ data });
    }

    throw new NotFoundException(`No se encontro el Owner con el ID: ${data.ownerId}`)

  }

  async findAllCompanies() {
    return this.prisma.deliveryCompany.findMany();
  }

  async findOneCompany(id: string) {
    const company = await this.prisma.deliveryCompany.findUnique({
      where: { id },
    });
    if (!company)
      throw new NotFoundException(`DeliveryCompany ${id} not found`);
    return company;
  }

  async findManyCompanyByOwnerId(ownerId: string) {

    const company = await this.prisma.deliveryCompany.findMany({
      where: { ownerId },
    });
    if (!company)
      throw new NotFoundException(`DeliveryCompany no se encontro nada${ownerId} not found`);
    return company;
  }

  async updateCompany(id: string, data: UpdateDeliveryCompanyDto) {
    await this.findOneCompany(id);
    return this.prisma.deliveryCompany.update({ where: { id }, data });
  }

  async deleteCompany(id: string) {
    await this.findOneCompany(id);
    return this.prisma.deliveryCompany.delete({ where: { id } });
  }

  async findCompaniesByOwner(ownerId: string) {
    return this.prisma.deliveryCompany.findMany({
      where: { ownerId },
    });
  }

  // ----------- Asignar delivery a una orden -----------
  async assignCompanyToOrder(orderId: string, companyId: string) {
    // Validar que la empresa existe (lanza NotFoundException si no)
    const company = await this.findOneCompany(companyId);

    // Actualizar el pedido y cambiar estado y deliveryCompanyId
    const updatedOrder = await this.prisma.order
      .update({
        where: { id: orderId },
        data: {
          deliveryCompanyId: company.id,
          status: OrderStatus.CONFIRMED,
        },
      })
      .catch(() => {
        throw new NotFoundException(`Order ${orderId} not found`);
      });

    // Obtener el DTO con toda la info detallada
    const dto = await this.orderQueryService.findOne(updatedOrder.id);

    // Emitir evento a la empresa de delivery
    this.orderGateway.emitOrderAssignedToDelivery(dto);

    return dto;
  }

  // ----------- Actualizar estado de la orden -----------
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Emitir actualización por WS
    this.orderGateway.emitOrderStatusUpdated(
      updated.id,
      updated.status,
      updated.userId,
      updated.businessId,
    );

    return updated;
  }
}
