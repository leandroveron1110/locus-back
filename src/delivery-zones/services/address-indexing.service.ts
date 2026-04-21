import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Ajusta la ruta a tu PrismaService
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

@Injectable()
export class AddressIndexingService {
  private readonly logger = new Logger(AddressIndexingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Este método se debe llamar cada vez que se crea o actualiza una dirección.
   * Determina en qué MacroZona y Barrio cae la coordenada y lo guarda en el índice.
   */
  async updateAddressIndex(addressId: string, lat: number, lng: number) {
    try {
      // 1. Obtenemos todas las MacroZonas y Zonas de Barrio activas
      const [macroZones, barrios] = await Promise.all([
        this.prisma.macroZone.findMany({ where: { isActive: true } }),
        this.prisma.deliveryZone.findMany({ where: { isActive: true } }),
      ]);

      const p = point([Number(lng), Number(lat)]);
      let foundMacroId: string | null = null;
      let foundBarrioId: string | null = null;

      // 2. Buscamos la Macro-Zona (Plaza o Cementerio)
      for (const mz of macroZones) {
        const geometry = mz.geometry as any;
        if (geometry?.type === 'Polygon') {
          if (booleanPointInPolygon(p, polygon(geometry.coordinates))) {
            foundMacroId = mz.id;
            break;
          }
        }
      }

      // 3. Buscamos el Barrio (San Isidro, Centro, etc.)
      for (const b of barrios) {
        const geometry = b.geometry as any;
        if (geometry?.type === 'Polygon') {
          if (booleanPointInPolygon(p, polygon(geometry.coordinates))) {
            foundBarrioId = b.id;
            break;
          }
        }
      }

      // 4. Guardamos o actualizamos en la tabla de índice
      await this.prisma.addressZoneIndex.upsert({
        where: { addressId },
        update: {
          macroZoneId: foundMacroId,
          barrioId: foundBarrioId,
        },
        create: {
          addressId,
          macroZoneId: foundMacroId,
          barrioId: foundBarrioId,
        },
      });

      this.logger.log(`Dirección ${addressId} indexada: Macro=${foundMacroId}, Barrio=${foundBarrioId}`);
    } catch (error) {
      this.logger.error(`Error indexando dirección ${addressId}:`, error);
    }
  }

  /**
   * Script de utilidad para indexar todas las direcciones existentes en la DB
   * Úsalo una sola vez después de crear las tablas.
   */
  async reindexAllAddresses() {
    const addresses = await this.prisma.address.findMany();
    this.logger.log(`Iniciando re-indexación de ${addresses.length} direcciones...`);
    
    for (const addr of addresses) {
      if (addr.latitude && addr.longitude) {
        await this.updateAddressIndex(addr.id, Number(addr.latitude), Number(addr.longitude));
      }
    }
    this.logger.log('Proceso de re-indexación completado.');
  }
}