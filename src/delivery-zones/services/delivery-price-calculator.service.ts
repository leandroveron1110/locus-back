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
  const clientH3 = latLngToCell(clientLat, clientLng, 9);

  // =========================================================
  // 1. DATOS DEL NEGOCIO (CACHEADO)
  // =========================================================

  const storeKey = `store_data:${storeAddressId}`;

  let storeData = await this.cacheManager.get<{
    barrioId: string;
    macroId: string;
  }>(storeKey);

  if (!storeData) {
    const storeAddress = await this.prisma.address.findUnique({
      where: { id: storeAddressId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!storeAddress?.latitude || !storeAddress?.longitude) {
      throw new BadRequestException(
        'Ubicación del negocio no válida',
      );
    }

    const storeH3 = latLngToCell(
      Number(storeAddress.latitude),
      Number(storeAddress.longitude),
      9,
    );

    const storeMatch = await this.prisma.h3Index.findFirst({
      where: {
        h3Index: storeH3,
      },
      select: {
        deliveryZoneId: true,
        macroZoneId: true,
      },
    });

    if (
      !storeMatch?.deliveryZoneId ||
      !storeMatch?.macroZoneId
    ) {
      throw new BadRequestException(
        'Negocio fuera de zona de servicio',
      );
    }

    storeData = {
      barrioId: storeMatch.deliveryZoneId,
      macroId: storeMatch.macroZoneId,
    };

    await this.cacheManager.set(
      storeKey,
      storeData,
      this.LONG_TTL,
    );
  }

  // =========================================================
  // 2. OBTENER BARRIO DEL CLIENTE
  // =========================================================

  const clientMatch = await this.prisma.h3Index.findFirst({
    where: {
      h3Index: clientH3,
      deliveryZoneId: {
        not: null,
      },
    },
    select: {
      deliveryZoneId: true,
      deliveryZone: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!clientMatch?.deliveryZoneId) {
    throw new BadRequestException(
      'Cliente fuera de cobertura',
    );
  }

  const clientZoneId = clientMatch.deliveryZoneId;

  // =========================================================
  // 3. CACHE DEL PRECIO FINAL
  // =========================================================

  const priceKey = `price:${deliveryCompanyId}:${storeData.barrioId}:${clientZoneId}`;

  let finalPrice =
    await this.cacheManager.get<number>(priceKey);

  // =========================================================
  // 4. CALCULO DE TARIFA
  // =========================================================

  if (finalPrice === undefined) {
    /**
     * IMPORTANTE:
     *
     * NO filtramos por macroZoneId.
     *
     * Porque necesitamos analizar TODAS las posibles
     * tarifas configuradas para ambos barrios.
     *
     * Luego nos quedamos con:
     * - el precio más alto del barrio origen
     * - el precio más alto del barrio destino
     * - y finalmente el mayor de ambos
     */

    const prices =
      await this.prisma.deliveryPriceMatrix.findMany({
        where: {
          deliveryCompanyId,
          deliveryZoneId: {
            in: [
              storeData.barrioId,
              clientZoneId,
            ],
          },
        },
        select: {
          price: true,
          deliveryZoneId: true,
          macroZoneId: true,
        },
      });

    if (!prices.length) {
      throw new BadRequestException(
        'Ruta no configurada',
      );
    }

    // =========================================================
    // 5. AGRUPAR PRECIOS POR BARRIO
    // =========================================================

    const grouped = new Map<string, number[]>();

    for (const p of prices) {
      if (!grouped.has(p.deliveryZoneId)) {
        grouped.set(p.deliveryZoneId, []);
      }

      grouped
        .get(p.deliveryZoneId)!
        .push(Number(p.price));
    }

    // =========================================================
    // 6. MAYOR PRECIO POR CADA BARRIO
    // =========================================================

    const storePrices =
      grouped.get(storeData.barrioId) || [];

    const clientPrices =
      grouped.get(clientZoneId) || [];

    const storeMax = Math.max(...storePrices, 0);

    const clientMax = Math.max(...clientPrices, 0);

    // =========================================================
    // 7. PRECIO FINAL
    // =========================================================

    finalPrice = Math.max(storeMax, clientMax);

    if (!finalPrice || finalPrice <= 0) {
      throw new BadRequestException(
        'Ruta no tarifada',
      );
    }

    // =========================================================
    // 8. CACHEAR RESULTADO
    // =========================================================

    await this.cacheManager.set(
      priceKey,
      finalPrice,
      this.LONG_TTL,
    );
  }

  // =========================================================
  // 9. RESPONSE
  // =========================================================

  return {
    price: finalPrice,
    zoneName: clientMatch.deliveryZone?.name,
    h3: clientH3,
  };
}

  async calculateForBusiness(
    businessId: string,
    clientLat: number,
    clientLng: number,
  ) {
    console.log(
      `Calculando precio para negocio ${businessId} y cliente en (${clientLat}, ${clientLng})`,
    );

    // 1. Buscamos la dirección del negocio (Sin transacción)
    const storeAddress = await this.prisma.address.findFirst({
      where: { businessId: businessId },
      select: { id: true },
    });

    if (!storeAddress) {
      throw new BadRequestException('Negocio no encontrado');
    }

    // 2. Buscamos la compañía de delivery (Ojo: aquí podrías filtrar por la activa o default)
    const deliveryCompany = await this.prisma.deliveryCompany.findFirst({
      select: { id: true },
    });

    if (!deliveryCompany) {
      throw new BadRequestException('Compañía de delivery no encontrada');
    }

    // 3. Llamamos al cálculo (Que ya maneja su propio caché y consultas)
    return this.calculate(
      storeAddress.id,
      clientLat,
      clientLng,
      deliveryCompany.id,
    );
  }
}
