import { Module } from '@nestjs/common';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryService } from './services/delivery.service';
import { OrderModule } from 'src/order/order.module';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService],
  imports: [OrderModule],
  exports: [DeliveryService]
})
export class DeliveryModule {}
