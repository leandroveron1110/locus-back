import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
  import { polygonToCells } from 'h3-js';


@Injectable()
export class AddressIndexingService {
  private readonly logger = new Logger(AddressIndexingService.name);

  constructor(private prisma: PrismaService) {}


async  indexZoneGeometry(zoneId: string, isMacro: boolean, geometry: any) {
  // 1. Convertir polígono a lista de celdas H3 (resolución 9)
  const h3Indices = polygonToCells(geometry.coordinates, 9, true);

  // 2. Guardar en la tabla H3Index
  await this.prisma.h3Index.createMany({
    data: h3Indices.map(h3 => ({
      h3Index: h3,
      [isMacro ? 'macroZoneId' : 'deliveryZoneId']: zoneId
    }))
  });
}
  /**
   * CALCULO DE PRECIO: Lógica de "Origen Dominante"
   * El negocio (origen) determina si usamos precios de Plaza o Cementerio.
   */
  async getDeliveryPrice(
    storeAddressId: string,
    clientAddressId: string,
    deliveryCompanyId: string,
  ) {
    // 1. Buscamos AMBOS índices en un solo viaje
    const indices = await this.prisma.addressZoneIndex.findMany({
      where: { addressId: { in: [storeAddressId, clientAddressId] } },
    });

    const storeIdx = indices.find((i) => i.addressId === storeAddressId);
    const clientIdx = indices.find((i) => i.addressId === clientAddressId);

    if (
      !storeIdx?.macroZoneId ||
      !storeIdx?.deliveryZoneId ||
      !clientIdx?.deliveryZoneId
    ) {
      throw new NotFoundException(
        'Ubicaciones fuera de cobertura o no indexadas.',
      );
    }

    const pivotMacroId = storeIdx.macroZoneId;

    // 2. Buscamos AMBOS precios en la matriz en un solo viaje
    // Usamos el índice compuesto que ya tienes definido (deliveryCompanyId_deliveryZoneId_macroZoneId)
    const priceEntries = await this.prisma.deliveryPriceMatrix.findMany({
      where: {
        deliveryCompanyId,
        macroZoneId: pivotMacroId,
        deliveryZoneId: {
          in: [storeIdx.deliveryZoneId, clientIdx.deliveryZoneId],
        },
      },
    });

    // Mapeamos los resultados
    const priceStoreEntry = priceEntries.find(
      (p) => p.deliveryZoneId === storeIdx.deliveryZoneId,
    );
    const priceClientEntry = priceEntries.find(
      (p) => p.deliveryZoneId === clientIdx.deliveryZoneId,
    );

    const priceStore = Number(priceStoreEntry?.price || 0);
    const priceClient = Number(priceClientEntry?.price || 0);

    if (priceStore === 0 && priceClient === 0) {
      throw new BadRequestException(
        'No hay precios configurados para este trayecto.',
      );
    }

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
