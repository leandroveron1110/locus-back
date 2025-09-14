import { OrderStatus } from '@prisma/client';
import {
  CreateDeliveryCompanyDto,
  UpdateDeliveryCompanyDto,
} from '../dtos/request/delivery-company.dto';

export interface IDeliveryService {
  createCompany(data: CreateDeliveryCompanyDto): Promise<any>;

  findAllCompanies(): Promise<any[]>;

  findOneCompany(id: string): Promise<any>;

  findManyCompanyByOwnerId(ownerId: string): Promise<any[]>;

  updateCompany(id: string, data: UpdateDeliveryCompanyDto): Promise<any>;

  deleteCompany(id: string): Promise<any>;

  findCompaniesByOwner(ownerId: string): Promise<any[]>;

  assignCompanyToOrder(orderId: string, companyId: string): Promise<any>;

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<any>;
}
