import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { DeliveryZonesService } from '../services/delivery-zones.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';
import { UpdateDeliveryZoneDto } from '../dtos/request/update-delivery-zone.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DeliveryZonesQueryService } from '../services/delivery-zones-query.service';
import { H3MigrationService } from '../services/H3Migration.service';
import { DeliveryPriceCalculatorService } from '../services/delivery-price-calculator.service';

@Controller('delivery-zones')
export class DeliveryZonesController {
  constructor(
    private readonly deliveryZonesService: DeliveryZonesService,
    private readonly deliveryZonesQueryService: DeliveryZonesQueryService,
    private readonly h3MigrationService: H3MigrationService,
    private readonly deliveryPriceCalculatorService: DeliveryPriceCalculatorService,
  ) {}

  // Endpoint para que la compañía de delivery cree una nueva zona.
  // Ejemplo de body: { "name": "Zona Norte", "price": 1000, "companyId": "uuid-company", "geometry": { "type": "Polygon", "coordinates": [[...]] } }
  @Post()
  @Roles(UserRole.OWNER)
  async create(@Body() createZoneDto: CreateDeliveryZoneDto) {
    return this.deliveryZonesService.create(createZoneDto);
  }

  @Get('to-h3')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async burnZonesToH3() {
    return this.h3MigrationService.burnZonesToH3();
  }

  @Post('calculate-price-addressid')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async calculate(
    @Body()
    cal: {
      storeAddressId: string;
      clientLat: number;
      clientLng: number;
      deliveryCompanyId: string;
    },
  ) {
    return this.deliveryPriceCalculatorService.calculate(
      cal.storeAddressId,
      cal.clientLat,
      cal.clientLng,
      cal.deliveryCompanyId,
    );
  }

  @Post('calculate-price')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async calculatePrice(
    @Body()
    cal: {
      businessId: string;
      clientLat: number;
      clientLng: number;
    },
  ) {
    return {
      price: 2500,
      zoneName: 'Zona Centro',
      h3: '8928308280fffff',
    }
    return this.deliveryPriceCalculatorService.calculateForBusiness(
      cal.businessId,
      cal.clientLat,
      cal.clientLng,
    );
  }

  @Get('company/:companyId')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async getAllZones(@Param('companyId') companyId: string) {
    return this.deliveryZonesQueryService.getAllZonesForCompany(companyId);
  }

  @Get('macro-zones')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async getMacroZones() {
    return this.deliveryZonesQueryService.getMacroZones();
  }

  // Endpoint para editar parcialmente una zona de entrega.
  // La ruta incluye el ID de la zona a editar.
  // Ejemplo de body: { "name": "Zona Norte (Actualizada)", "price": 1100 }
  @Patch(':id')
  @Roles(UserRole.OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateZoneDto: UpdateDeliveryZoneDto,
  ) {
    return this.deliveryZonesService.update(id, updateZoneDto);
  }

  // Endpoint para eliminar una zona de entrega por su ID.
  // La ruta incluye el ID de la zona a eliminar.
  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(@Param('id') id: string) {
    return this.deliveryZonesService.remove(id);
  }

  // Endpoint para que el cliente obtenga el precio de una ubicación.
  // Ejemplo de body: { "companyId": "uuid-company", "lat": -34.6037, "lng": -58.3816 }
  // @Post('calculate-price')
  // @Roles(UserRole.CLIENT, UserRole.OWNER)
  // async calculatePrice(
  //   @Body()
  //   body: {
  //     companyId: string;
  //     customerLat: number;
  //     customerLng: number;
  //     businessLat: number;
  //     businessLng: number;
  //   },
  // ) {
  //   const price = await this.deliveryZonesQueryService.calculatePrice(
  //     body.companyId,
  //     body.customerLat,
  //     body.customerLng,
  //     body.businessLat,
  //     body.businessLng,
  //   );

  //   return { ...price };
  // }

  @Post('options')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  async getAvailableDeliveries(
    @Body()
    body: {
      clientAddressId: string;
      businessId: string;
    },
  ) {
    const companiesWithPrices =
      await this.deliveryZonesQueryService.getAutoDeliveryPrice(
        body.businessId,
        body.clientAddressId,
      );

    return companiesWithPrices;
  }

  @Get('zones/:companyId')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  async getZonesByDeliberyCompany(@Param('companyId') companyId: string) {
    return this.deliveryZonesService.getZonesByDeliveryCompany(companyId);
  }
}
