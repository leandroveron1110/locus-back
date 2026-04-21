import {
  Controller,
  Post,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { AddressIndexingService } from '../services/address-indexing.service';

@Controller('address-indexing')
export class AddressIndexingController {
  constructor(
    private readonly addressIndexingService: AddressIndexingService,
  ) {}

  // 🔹 Indexar una dirección
  @Post('index')
  async indexAddress(@Body() body: any) {
    return this.addressIndexingService.index(body);
  }

  // 🔹 Buscar direcciones
  @Get('search')
  async search(@Query('q') query: string) {
    return this.addressIndexingService.search(query);
  }

  // 🔹 Reindexar todo (útil para mantenimiento)
  @Post('reindex')
  async reindexAll() {
    return this.addressIndexingService.reindexAll();
  }
}