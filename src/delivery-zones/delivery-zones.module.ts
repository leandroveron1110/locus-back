import { Module } from '@nestjs/common';
import { DeliveryZonesController } from './controllers/delivery-zones.controller';
import { DeliveryZonesService } from './services/delivery-zones.service';

@Module({
  controllers: [DeliveryZonesController],
  providers: [DeliveryZonesService]
})
export class DeliveryZonesModule {}
