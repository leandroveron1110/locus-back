import { Module } from '@nestjs/common';
import { DeliveryZonesController } from './controllers/delivery-zones.controller';
import { DeliveryZonesService } from './services/delivery-zones.service';
import { DeliveryZonesQueryService } from './services/delivery-zones-query.service';

@Module({
  controllers: [DeliveryZonesController],
  providers: [DeliveryZonesService, DeliveryZonesQueryService]
})
export class DeliveryZonesModule {}
