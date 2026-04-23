import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

@Injectable()
export class AddressIndexingService {
  private readonly logger = new Logger(AddressIndexingService.name);

  constructor(private prisma: PrismaService) {}
/**
   * CALCULO DE PRECIO: Lógica de "Origen Dominante"
   * El negocio (origen) determina si usamos precios de Plaza o Cementerio.
   */
  async getDeliveryPrice(
    storeAddressId: string,
    clientAddressId: string,
    deliveryCompanyId: string,
  ) {
    // 1. Buscamos los índices de ambas direcciones (Cache geográfico)
    const [storeIdx, clientIdx] = await Promise.all([
      this.prisma.addressZoneIndex.findUnique({ where: { addressId: storeAddressId } }),
      this.prisma.addressZoneIndex.findUnique({ where: { addressId: clientAddressId } }),
    ]);

    // Verificamos que el negocio tenga una MacroZona (Plaza/Cementerio)
    if (!storeIdx?.macroZoneId || !storeIdx?.deliveryZoneId) {
      throw new NotFoundException('La ubicación del negocio no está indexada o está fuera de cobertura.');
    }
    
    if (!clientIdx?.deliveryZoneId) {
      throw new NotFoundException('La ubicación del cliente no está dentro de un barrio válido.');
    }

    // EL PIVOTE: La MacroZona del negocio determina la columna de la matriz
    const pivotMacroId = storeIdx.macroZoneId;

    // 2. Buscamos los precios de AMBOS barrios usando el pivote del negocio
    const [priceStoreEntry, priceClientEntry] = await Promise.all([
      this.prisma.deliveryPriceMatrix.findUnique({
        where: {
          deliveryCompanyId_deliveryZoneId_macroZoneId: {
            deliveryCompanyId,
            deliveryZoneId: storeIdx.deliveryZoneId, // Barrio del negocio
            macroZoneId: pivotMacroId,        // Basado en el origen
          },
        },
      }),
      this.prisma.deliveryPriceMatrix.findUnique({
        where: {
          deliveryCompanyId_deliveryZoneId_macroZoneId: {
            deliveryCompanyId,
            deliveryZoneId: clientIdx.deliveryZoneId, // Barrio del cliente
            macroZoneId: pivotMacroId,         // TAMBIÉN basado en el origen
          },
        },
      }), 
    ]);

    const priceStore = Number(priceStoreEntry?.price || 0);
    const priceClient = Number(priceClientEntry?.price || 0);

    if (priceStore === 0 && priceClient === 0) {
      throw new BadRequestException('No hay precios configurados para este trayecto.');
    }

    // 3. Retornamos el máximo según tu regla
    return {
      success: true,
      finalPrice: Math.max(priceStore, priceClient),
      meta: {
        originMacro: pivotMacroId,
        storePrice: priceStore,
        clientPrice: priceClient,
      },
    };
  }

  /**
   * MANTENIMIENTO: Indexar una dirección (Geofencing)
   */
  async updateAddressIndex(addressId: string, lat: number, lng: number) {
    try {
      const [macroZones, barrios] = await Promise.all([
        this.prisma.macroZone.findMany({ where: { isActive: true } }),
        this.prisma.deliveryZone.findMany({ where: { isActive: true } }),
      ]);

      const p = point([Number(lng), Number(lat)]);
      let foundMacroId: string | null = null;
      let foundBarrioId: string | null = null;

      for (const mz of macroZones) {
        const geometry = mz.geometry as any;
        if (
          geometry?.type === 'Polygon' &&
          booleanPointInPolygon(p, polygon(geometry.coordinates))
        ) {
          foundMacroId = mz.id;
          break;
        }
      }

      for (const b of barrios) {
        const geometry = b.geometry as any;
        if (
          geometry?.type === 'Polygon' &&
          booleanPointInPolygon(p, polygon(geometry.coordinates))
        ) {
          foundBarrioId = b.id;
          break;
        }
      }

      return await this.prisma.addressZoneIndex.upsert({
        where: { addressId },
        update: { macroZoneId: foundMacroId, deliveryZoneId: foundBarrioId },
        create: {
          addressId,
          macroZoneId: foundMacroId,
          deliveryZoneId: foundBarrioId,
        },
      });
    } catch (error) {
      this.logger.error(`Error indexando ${addressId}`, error);
      throw error;
    }
  }

  /**
   * MANTENIMIENTO: Re-indexar todo
   */
  async reindexAllAddresses() {
    const addresses = await this.prisma.address.findMany();
    for (const addr of addresses) {
      if (addr.latitude && addr.longitude) {
        await this.updateAddressIndex(
          addr.id,
          Number(addr.latitude),
          Number(addr.longitude),
        );
      }
    }
    return { message: `Procesadas ${addresses.length} direcciones.` };
  }
}
