import { Module } from '@nestjs/common';
import { AddressesController } from './controllers/address.controller';
import { AddressService } from './services/address.service';

@Module({
  controllers: [AddressesController],
  providers: [AddressService]
})
export class AddressModule {}
