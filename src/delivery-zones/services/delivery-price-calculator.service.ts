import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { latLngToCell } from 'h3-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryPriceCalculatorService {
  private readonly LONG_TTL = 15552000000; // 6 meses

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async calculate(
    storeAddressId: string,
    clientLat: number,
    clientLng: number,
    deliveryCompanyId: string,
  ) {
    // 1. H3: Cálculo matemático puro (no se cachea, es ultra rápido)
    const clientH3 = latLngToCell(clientLat, clientLng, 9);

    // 2. Cacheamos solo lo que es constante: El Negocio
    const storeKey = `store_data:${storeAddressId}`;
    let storeData = await this.cacheManager.get<{
      barrioId: string;
      macroId: string;
    }>(storeKey);

    if (!storeData) {
      const dbStore = await this.prisma.addressZoneIndex.findUnique({
        where: { addressId: storeAddressId },
        select: { deliveryZoneId: true, macroZoneId: true },
      });
      if (!dbStore || !dbStore.deliveryZoneId || !dbStore.macroZoneId)
        throw new BadRequestException('Negocio no configurado');
      storeData = {
        barrioId: dbStore.deliveryZoneId,
        macroId: dbStore.macroZoneId,
      };
      await this.cacheManager.set(storeKey, storeData, this.LONG_TTL);
    }

    // 3. El Barrio del cliente: Consulta directa a DB (con índice en h3Index vuela)
    // No cacheamos clientH3 para no saturar la RAM con miles de puntos geográficos
    const clientMatch = await this.prisma.h3Index.findFirst({
      where: { h3Index: clientH3, deliveryZoneId: { not: null } },
      select: {
        deliveryZoneId: true,
        deliveryZone: { select: { name: true } },
      },
    });

    if (!clientMatch?.deliveryZoneId)
      throw new BadRequestException('Fuera de cobertura');
    const clientZoneId = clientMatch.deliveryZoneId;

    // 4. Precio Final: Cacheamos por "Ruta de Barrios" (esto sí es finito y repetitivo)
    const priceKey = `price:${deliveryCompanyId}:${storeData.macroId}:${storeData.barrioId}:${clientZoneId}`;
    let finalPrice = await this.cacheManager.get<number>(priceKey);

    if (finalPrice === undefined) {
      // BATCH QUERY: Traemos los precios de la matriz para Origen y Destino en un solo viaje
      const prices = await this.prisma.deliveryPriceMatrix.findMany({
        where: {
          deliveryCompanyId,
          macroZoneId: storeData.macroId,
          deliveryZoneId: { in: [storeData.barrioId, clientZoneId] },
        },
        select: { price: true, deliveryZoneId: true },
      });

      // Podrías hacer esto para ser más estricto:
      const pricesMap = new Map(
        prices.map((p) => [p.deliveryZoneId, Number(p.price)]),
      );
      const p1 = pricesMap.get(storeData.barrioId);
      const p2 = pricesMap.get(clientZoneId);

      if (p1 === undefined || p2 === undefined) {
        throw new BadRequestException('Ruta no configurada completamente');
      }
      finalPrice = Math.max(p1, p2);

      if (finalPrice === 0) throw new BadRequestException('Ruta no tarifada');

      // Cacheamos el resultado del cálculo para que otros clientes en el mismo barrio lo aprovechen
      await this.cacheManager.set(priceKey, finalPrice, this.LONG_TTL);
    }

    return {
      price: finalPrice,
      zoneName: clientMatch.deliveryZone?.name,
      h3: clientH3,
    };
  }
}
