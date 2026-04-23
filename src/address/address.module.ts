import { Module } from '@nestjs/common';
import { AddressesController } from './controllers/address.controller';
import { AddressService } from './services/address.service';
import { DeliveryZonesModule } from 'src/delivery-zones/delivery-zones.module';

@Module({
  controllers: [AddressesController],
  providers: [AddressService],
  imports: [DeliveryZonesModule]
})
export class AddressModule {}
