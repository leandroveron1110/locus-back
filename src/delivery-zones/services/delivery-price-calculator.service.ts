import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { latLngToCell } from 'h3-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryPriceCalculatorService {
  private readonly STORE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 días
  private readonly PRICE_TTL = 1000 * 60 * 60 * 24 * 180; // 6 meses

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async calculate(
    storeAddressId: string,
    clientLat: number,
    clientLng: number,
    deliveryCompanyId: string,
  ) {
    // =========================================================
    // 1. CLIENT ZONE (SIEMPRE DB - RESOLUCIÓN BASE)
    // =========================================================
    const clientMatch = await this.prisma.h3Index.findFirst({
      where: {
        h3Index: latLngToCell(clientLat, clientLng, 9),
        deliveryZoneId: { not: null },
      },
      select: {
        deliveryZoneId: true,
        deliveryZone: {
          select: { name: true },
        },
      },
    });

    console.log('Client match:', clientMatch);
    if (!clientMatch?.deliveryZoneId) {
      throw new BadRequestException('Cliente fuera de cobertura');
    }

    const clientZoneId = clientMatch.deliveryZoneId;
    const clientZoneName = clientMatch.deliveryZone?.name ?? 'Zona desconocida';

    // =========================================================
    // 2. STORE ZONE (CACHE + DB fallback)
    // =========================================================
    const storeKey = `store_zone:${storeAddressId}`;

    let storeZone = await this.cacheManager.get<{
      zoneId: string;
      macroId: string;
    }>(storeKey);
 
    console.log(`El negocio esta guardado en cache? ${!!storeZone}`);
    if (!storeZone) {
      const storeAddress = await this.prisma.address.findUnique({
        where: { id: storeAddressId },
        select: {
          latitude: true,
          longitude: true,
        },
      });

      if (!storeAddress?.latitude || !storeAddress?.longitude) {
        throw new BadRequestException('Ubicación del negocio no válida');
      }

      const storeMatch = await this.prisma.h3Index.findFirst({
        where: {
          h3Index: latLngToCell(
            Number(storeAddress.latitude),
            Number(storeAddress.longitude),
            9,
          ),
        },
        select: {
          deliveryZoneId: true,
          macroZoneId: true,
        },
      });

      if (!storeMatch?.deliveryZoneId || !storeMatch?.macroZoneId) {
        throw new BadRequestException('Negocio fuera de zona de servicio');
      }

      storeZone = {
        zoneId: storeMatch.deliveryZoneId,
        macroId: storeMatch.macroZoneId,
      };

      await this.cacheManager.set(storeKey, storeZone, this.STORE_TTL);
    }

    // =========================================================
    // 3. PRICE CACHE (CORE DEL SISTEMA)
    // =========================================================
    const priceKey =
      `price:${deliveryCompanyId}:${storeZone.zoneId}:${clientZoneId}`;
      console.log(`Buscando precio en cache con key: ${priceKey}`);
    console.log(`Store Zone: ${storeZone.zoneId}, Client Zone: ${clientZoneId}`);

    let finalPrice = await this.cacheManager.get<number>(priceKey);
    console.log(`El precio esta guardado en cache? ${!!finalPrice}`);

    // =========================================================
    // 4. CALCULO SOLO EN MISS
    // =========================================================
    if (finalPrice === undefined) {
      const priceAgg = await this.prisma.deliveryPriceMatrix.groupBy({
        by: ['deliveryZoneId'],
        where: {
          deliveryCompanyId,
          deliveryZoneId: {
            in: [storeZone.zoneId, clientZoneId],
          },
        },
        _max: {
          price: true,
        },
      });

      if (!priceAgg.length) {
        throw new BadRequestException('Ruta no configurada');
      }

      const maxPrices = priceAgg.map((p) => Number(p._max.price || 0));
      finalPrice = Math.max(...maxPrices, 0);

      if (!finalPrice) {
        throw new BadRequestException('Ruta no tarifada');
      }

      await this.cacheManager.set(priceKey, finalPrice, this.PRICE_TTL);
    }

    // =========================================================
    // 5. RESPONSE
    // =========================================================
    return {
      price: finalPrice,
      zoneName: clientZoneName,
      clientZoneId,
      storeZoneId: storeZone.zoneId,
    };
  }

  async calculateForBusiness(
    businessId: string,
    clientLat: number,
    clientLng: number,
  ) {
    const [storeAddress, deliveryCompany] = await Promise.all([
      this.prisma.address.findFirst({
        where: { businessId },
        select: { id: true },
      }),
      this.prisma.deliveryCompany.findFirst({
        select: { id: true },
      }),
    ]);

    if (!storeAddress) {
      throw new BadRequestException('Negocio no encontrado');
    }

    if (!deliveryCompany) {
      throw new BadRequestException('Compañía de delivery no encontrada');
    }

    return this.calculate(
      storeAddress.id,
      clientLat,
      clientLng,
      deliveryCompany.id,
    );
  }
}