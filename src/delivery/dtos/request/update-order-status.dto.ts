import { IsEnum } from 'class-validator';
import { OrderStatus } from 'src/delivery/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
