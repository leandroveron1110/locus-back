import { Module } from '@nestjs/common';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryService } from './services/delivery.service';
import { OrderModule } from 'src/order/order.module';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  controllers: [DeliveryController],
  providers: [
    {
      provide: TOKENS.IDeliveryService,
      useClass: DeliveryService
    }
    ],
  imports: [OrderModule],
  exports: [TOKENS.IDeliveryService]
})
export class DeliveryModule {}
