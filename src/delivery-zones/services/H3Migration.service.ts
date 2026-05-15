import { Injectable } from '@nestjs/common';
import { polygonToCells } from 'h3-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class H3MigrationService {
  constructor(private prisma: PrismaService) {}

  async burnZonesToH3() {
    // 1. Limpiar índices actuales
    await this.prisma.h3Index.deleteMany({});

    // Usaremos un Map para consolidar la info de cada hexágono antes de subirlo
    // Key: string (h3Index), Value: objeto con los IDs
    const h3Map = new Map<string, { macroZoneId?: string; deliveryZoneId?: string }>();

    // 2. Procesar MacroZonas
    const macros = await this.prisma.macroZone.findMany();
    for (const mz of macros) {
      if (mz.geometry) {
        const cells = polygonToCells((mz.geometry as any).coordinates, 9, true);
        for (const h3Index of cells) {
          h3Map.set(h3Index, { ...h3Map.get(h3Index), macroZoneId: mz.id });
        }
      }
    }

    // 3. Procesar DeliveryZones (Barrios)
    const zones = await this.prisma.deliveryZone.findMany();
    for (const dz of zones) {
      if (dz.geometry) {
        const cells = polygonToCells((dz.geometry as any).coordinates, 9, true);
        for (const h3Index of cells) {
          h3Map.set(h3Index, { ...h3Map.get(h3Index), deliveryZoneId: dz.id });
        }
      }
    }

    // 4. Inserción masiva consolidada
    const dataToInsert = Array.from(h3Map.entries()).map(([h3Index, ids]) => ({
      h3Index,
      macroZoneId: ids.macroZoneId || null,
      deliveryZoneId: ids.deliveryZoneId || null,
    }));

    // Dividimos en chunks si son demasiados (Prisma tiene límites de batch)
    const chunkSize = 5000;
    for (let i = 0; i < dataToInsert.length; i += chunkSize) {
      const chunk = dataToInsert.slice(i, i + chunkSize);
      await this.prisma.h3Index.createMany({ data: chunk });
    }

    console.log(`Migración completada: ${dataToInsert.length} hexágonos indexados.`);
  }
}