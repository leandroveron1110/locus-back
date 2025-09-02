import { Controller, Post, Body, Get, Param, Put, Delete, Patch } from '@nestjs/common';
import { DeliveryZonesService } from '../services/delivery-zones.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';
import { UpdateDeliveryZoneDto } from '../dtos/request/update-delivery-zone.dto';

@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly deliveryZonesService: DeliveryZonesService) {}

  // Endpoint para que la compañía de delivery cree una nueva zona.
  // Ejemplo de body: { "name": "Zona Norte", "price": 1000, "companyId": "uuid-company", "geometry": { "type": "Polygon", "coordinates": [[...]] } }
  @Post()
  async create(@Body() createZoneDto: CreateDeliveryZoneDto) {
    return this.deliveryZonesService.create(createZoneDto);
  }

  // Endpoint para editar parcialmente una zona de entrega.
  // La ruta incluye el ID de la zona a editar.
  // Ejemplo de body: { "name": "Zona Norte (Actualizada)", "price": 1100 }
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateZoneDto: UpdateDeliveryZoneDto) {
    console.log(id, updateZoneDto)
    return this.deliveryZonesService.update(id, updateZoneDto);
  }

  // Endpoint para eliminar una zona de entrega por su ID.
  // La ruta incluye el ID de la zona a eliminar.
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.deliveryZonesService.remove(id);
  }

  // Endpoint para que el cliente obtenga el precio de una ubicación.
  // Ejemplo de body: { "companyId": "uuid-company", "lat": -34.6037, "lng": -58.3816 }
  @Post('calculate-price')
  async calculatePrice(@Body() body: { companyId: string; lat: number; lng: number }) {
    const price = await this.deliveryZonesService.calculatePrice(
      body.companyId,
      body.lat,
      body.lng,
    );

    if (price !== null) {
      return { price, message: 'Precio calculado exitosamente.' };
    } else {
      return { price: null, message: 'Ubicación fuera del área de servicio de la compañía.' };
    }
  }

  @Get('zones/:companyId')
  async getZonesByDeliberyCompany(@Param('companyId') companyId: string) {
    return this.deliveryZonesService.getZonesByDeliberyCompany(companyId);
  }
}
