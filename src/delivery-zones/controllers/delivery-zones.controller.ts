// src/delivery-zones/delivery-zones.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { DeliveryZonesService } from '../services/delivery-zones.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';

@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly deliveryZonesService: DeliveryZonesService) {}

  // Endpoint para que la compañía de delivery cree una nueva zona.
  // Ejemplo de body: { "name": "Zona Norte", "price": 1000, "companyId": "uuid-company", "geometry": { "type": "Polygon", "coordinates": [[...]] } }
  @Post()
  async create(@Body() createZoneDto: CreateDeliveryZoneDto) {
    return this.deliveryZonesService.create(createZoneDto);
  }

  // Endpoint para que el cliente obtenga el precio de una ubicación.
  // Ejemplo de body: { "companyId": "uuid-company", "lat": -34.6037, "lng": -58.3816 }
  @Post('calculate-price')
  async calculatePrice(@Body() body: { companyId: string; lat: number; lng: number }) {
    const price = await this.deliveryZonesService.calculatePrice(
      body.companyId,
      body.lat,
      body.lng
    );

    if (price !== null) {
      return { price, message: 'Precio calculado exitosamente.' };
    } else {
      return { price: null, message: 'Ubicación fuera del área de servicio de la compañía.' };
    }
  }
}