import { Controller, Post, Body, Get } from '@nestjs/common';
import { ZoneManagementService } from '../services/zone-zanagement.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/delivery-setup')
export class ZoneManagementController {
  constructor(private readonly zoneService: ZoneManagementService) {}

  // Crear una MacroZona (Origen) [cite: 199]
  @Post('macro-zones')
  async addMacro(@Body() body: { name: string; geometry: any }) {
    return this.zoneService.createMacroZone(body.name, body.geometry);
  }

  @Get('macro-zones/ids')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async getMacroZonesIds() {
    return this.zoneService.getMacroZonesIds();
  }

  // Crear un Barrio (Destino) vinculado a una empresa
  @Post('barrios')
  async addBarrio(
    @Body() body: { name: string; geometry: any; companyId: string },
  ) {
    return this.zoneService.createBarrio(
      body.name,
      body.geometry,
      body.companyId,
    );
  }

  // Cargar precio en la matriz
  @Post('prices')
  async updateMatrix(
    @Body()
    body: {
      companyId: string;
      barrioId: string;
      macroId: string;
      price: number;
    },
  ) {
    return this.zoneService.setPrice(body);
  }

  @Post('prices-all')
  @Roles(UserRole.OWNER, UserRole.CLIENT)
  async savePriceMatrix(
    @Body()
    body: {
      companyId: string;
      barrioId: string;
      macroId: string;
      price: number;
    }[],
  ) {
    return this.zoneService.savePriceMatrix(body);
  }
}
