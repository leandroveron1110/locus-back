import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressIndexingService } from '../services/address-indexing.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('address-indexing')
export class AddressIndexingController {
  constructor(
    private readonly addressIndexingService: AddressIndexingService,
  ) {}

  /**
   * Endpoint estrella: Calcula cuánto sale el viaje
   * GET /address-indexing/estimate-price?storeAddressId=...&clientAddressId=...&companyId=...
   */
  @Get('estimate-price')
  async estimate(
    @Query()
    query: {
      storeAddr: string;
      clientAddr: string;
      companyId: string;
    },
  ) {
    return this.addressIndexingService.getDeliveryPrice(
      query.storeAddr,
      query.clientAddr,
      query.companyId,
    );
  }

  /**
   * Indexar manualmente una dirección
   */
  @Post('index/:addressId')
  async indexAddress(
    @Param('addressId') addressId: string,
    @Body() coords: { lat: number; lng: number },
  ) {
    return this.addressIndexingService.updateAddressIndex(
      addressId,
      coords.lat,
      coords.lng,
    );
  }

  /**
   * Re-indexación masiva (Mantenimiento)
   */
  @Post('reindex-all')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  @HttpCode(HttpStatus.ACCEPTED)
  async reindexAll() {
    return this.addressIndexingService.reindexAllAddresses();
  }
}
