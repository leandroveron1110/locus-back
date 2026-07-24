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
  // 1. OBTENER DATOS DE NEGOCIO Y CLIENTE EN PARALELO
  // =========================================================
  const [storeData, clientMatch] = await Promise.all([
    this.getStoreData(storeAddressId),
    this.prisma.h3Index.findFirst({
      where: {
        h3Index: clientH3,
        deliveryZoneId: { not: null },
      },
      select: {
        deliveryZoneId: true,
        macroZoneId: true,
        deliveryZone: {
          select: { name: true },
        },
      },
    }),
  ]);

  if (!clientMatch?.deliveryZoneId || !clientMatch?.macroZoneId) {
    throw new BadRequestException('Cliente fuera de cobertura');
  }

  const clientZoneId = clientMatch.deliveryZoneId;
  const clientMacroId = clientMatch.macroZoneId;
  const isSameMacro = storeData.macroId === clientMacroId;

  // =========================================================
  // 2. CACHÉ DEL PRECIO FINAL
  // =========================================================
  const priceKey = `price:${deliveryCompanyId}:${storeData.barrioId}:${clientZoneId}:${storeData.macroId}:${clientMacroId}`;

  let finalPrice = await this.cacheManager.get<number>(priceKey);

  // =========================================================
  // 3. CÁLCULO DE TARIFA (SI NO ESTÁ EN CACHÉ)
  // =========================================================
  if (finalPrice === undefined) {
    const prices = await this.prisma.deliveryPriceMatrix.findMany({
      where: {
        deliveryCompanyId,
        deliveryZoneId: {
          in: [storeData.barrioId, clientZoneId],
        },
        // Si es la misma macrozona, filtramos directamente en DB.
        // Si no, trae todas las opciones posibles (los 4 registros).
        ...(isSameMacro && { macroZoneId: storeData.macroId }),
      },
      select: {
        price: true,
      },
    });

    if (!prices.length) {
      throw new BadRequestException('Ruta no configurada');
    }

    // Al filtrar en la query según el caso, la regla SIEMPRE se reduce 
    // a obtener el precio máximo devuelto por la base de datos.
    finalPrice = Math.max(...prices.map((p) => Number(p.price)));

    if (!finalPrice || finalPrice <= 0) {
      throw new BadRequestException('Ruta no tarifada');
    }

    await this.cacheManager.set(priceKey, finalPrice, this.LONG_TTL);
  }

  // =========================================================
  // 4. RESPUESTA
  // =========================================================
  return {
    price: finalPrice,
    zoneName: clientMatch.deliveryZone?.name,
    h3: clientH3,
    isSameMacro,
  };
}

/**
 * Método auxiliar privado para modularizar y mantener limpio el método principal.
 */
private async getStoreData(storeAddressId: string): Promise<{ barrioId: string; macroId: string }> {
  const storeKey = `store_data:${storeAddressId}`;

  const cached = await this.cacheManager.get<{ barrioId: string; macroId: string }>(storeKey);
  if (cached) return cached;

  const storeAddress = await this.prisma.address.findUnique({
    where: { id: storeAddressId },
    select: { latitude: true, longitude: true },
  });

  if (!storeAddress?.latitude || !storeAddress?.longitude) {
    throw new BadRequestException('Ubicación del negocio no válida');
  }

  const storeH3 = latLngToCell(
    Number(storeAddress.latitude),
    Number(storeAddress.longitude),
    9,
  );

  const storeMatch = await this.prisma.h3Index.findFirst({
    where: { h3Index: storeH3 },
    select: {
      deliveryZoneId: true,
      macroZoneId: true,
    },
  });

  if (!storeMatch?.deliveryZoneId || !storeMatch?.macroZoneId) {
    throw new BadRequestException('Negocio fuera de zona de servicio');
  }

  const storeData = {
    barrioId: storeMatch.deliveryZoneId,
    macroId: storeMatch.macroZoneId,
  };

  await this.cacheManager.set(storeKey, storeData, this.LONG_TTL);

  return storeData;
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