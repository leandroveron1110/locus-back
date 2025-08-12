import { Order, OrderStatus } from '@prisma/client';
import {
  CreateOrderDto,
  CreateOrderFullDTO,
  UpdateOrderDTO,
} from '../dtos/request/order.dto';

export interface IOrderService {
  create(createOrderDto: CreateOrderDto): Promise<Order>;

  createFullOrder(dto: CreateOrderFullDTO): Promise<Order>;

  findAll(): Promise<Order[]>;

  findOne(id: string): Promise<any>; // aquí usas OrderResponseDtoMapper.fromPrisma, por eso puse any (puedes importar el tipo si tienes)

  findOrdersByBusiness(businessId: string): Promise<any[]>;

  findOrdersByUserId(userId: string): Promise<any[]>;

  findOrdersByDeliveyId(deliveryId: string): Promise<any[]>;

  update(id: string, updateOrderDto: UpdateOrderDTO): Promise<Order>;

  updateStatus(id: string, updateOrderStatus: OrderStatus): Promise<Order>;

  remove(id: string): Promise<Order>;
}


export interface IOrderValidationService {
  validateCreateFullOrder(dto: CreateOrderFullDTO): Promise<void>;
}