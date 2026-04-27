import { Module } from '@nestjs/common';
import { DeliveryZonesController } from './controllers/delivery-zones.controller';
import { DeliveryZonesService } from './services/delivery-zones.service';
import { DeliveryZonesQueryService } from './services/delivery-zones-query.service';
import { AddressIndexingService } from './services/address-indexing.service';
import { AddressIndexingController } from './controllers/AddressIndexing.controller';
import { ZoneManagementController } from './controllers/zone-management.controller';
import { ZoneManagementService } from './services/zone-zanagement.service';
import { H3MigrationService } from './services/H3Migration.service';
import { DeliveryPriceCalculatorService } from './services/delivery-price-calculator.service';

@Module({
  controllers: [
    DeliveryZonesController,
    AddressIndexingController,
    ZoneManagementController,
  ],
  providers: [
    DeliveryZonesService,
    DeliveryZonesQueryService,
    AddressIndexingService,
    ZoneManagementService,
    H3MigrationService,
    DeliveryPriceCalculatorService
  ],
  exports: [DeliveryZonesQueryService, AddressIndexingService],
})
export class DeliveryZonesModule {}
