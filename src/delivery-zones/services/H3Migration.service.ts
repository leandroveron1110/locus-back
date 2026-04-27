import { Injectable } from '@nestjs/common';
import { polygonToCells } from 'h3-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class H3MigrationService {
  constructor(private prisma: PrismaService) {}

  async burnZonesToH3() {
    // 1. Limpiar índices actuales para evitar duplicados
    await this.prisma.h3Index.deleteMany({});

    // 2. Quemar MacroZonas
    const macros = await this.prisma.macroZone.findMany();
    for (const mz of macros) {
      if (mz.geometry) {
        const cells = polygonToCells((mz.geometry as any).coordinates, 9, true);
        await this.prisma.h3Index.createMany({
          data: cells.map(h3Index => ({ h3Index, macroZoneId: mz.id }))
        });
      }
    }

    // 3. Quemar DeliveryZones
    const zones = await this.prisma.deliveryZone.findMany();
    for (const dz of zones) {
      if (dz.geometry) {
        const cells = polygonToCells((dz.geometry as any).coordinates, 9, true);
        await this.prisma.h3Index.createMany({
          data: cells.map(h3Index => ({ h3Index, deliveryZoneId: dz.id }))
        });
      }
    }
  }
}