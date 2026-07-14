import { Injectable, BadRequestException } from '@nestjs/common';
import { latLngToCell } from 'h3-js';
import { PrismaService } from 'src/prisma/prisma.service';

import { IDeliveryPriceRepository } from './delivery-price.repository';
import {
  ClientZoneData,
  StoreZoneData,
} from './delivery-price.types';

@Injectable()
export class PrismaDeliveryPriceRepository
  implements IDeliveryPriceRepository
{
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtiene la zona donde pertenece el negocio.
   */
  async getStoreZone(
    storeAddressId: string,
  ): Promise<StoreZoneData> {
    const address =
      await this.prisma.address.findUnique({
        where: {
          id: storeAddressId,
        },
        select: {
          latitude: true,
          longitude: true,
        },
      });

    if (!address?.latitude || !address?.longitude) {
      throw new BadRequestException(
        'Ubicación del negocio no válida',
      );
    }

    const h3 = latLngToCell(
      Number(address.latitude),
      Number(address.longitude),
      9,
    );

    const match =
      await this.prisma.h3Index.findFirst({
        where: {
          h3Index: h3,
        },
        select: {
          deliveryZoneId: true,
          macroZoneId: true,
        },
      });

    if (
      !match?.deliveryZoneId ||
      !match?.macroZoneId
    ) {
      throw new BadRequestException(
        'Negocio fuera de cobertura',
      );
    }

    return {
      zoneId: match.deliveryZoneId,
      macroZoneId: match.macroZoneId,
    };
  }

  /**
   * Obtiene la zona del cliente.
   */
  async getClientZone(
    lat: number,
    lng: number,
  ): Promise<ClientZoneData> {
    const h3 = latLngToCell(lat, lng, 9);

    const match =
      await this.prisma.h3Index.findFirst({
        where: {
          h3Index: h3,
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

    if (!match?.deliveryZoneId) {
      throw new BadRequestException(
        'Cliente fuera de cobertura',
      );
    }

    return {
      zoneId: match.deliveryZoneId,
      zoneName:
        match.deliveryZone?.name ??
        'Zona desconocida',
      h3,
    };
  }

  /**
   * Calcula el precio entre dos zonas.
   */
  async getPrice(
    deliveryCompanyId: string,
    storeZoneId: string,
    clientZoneId: string,
  ): Promise<number> {
    const prices =
      await this.prisma.deliveryPriceMatrix.findMany({
        where: {
          deliveryCompanyId,
          deliveryZoneId: {
            in: [
              storeZoneId,
              clientZoneId,
            ],
          },
        },
        select: {
          price: true,
          deliveryZoneId: true,
        },
      });

    if (!prices.length) {
      throw new BadRequestException(
        'Ruta no configurada',
      );
    }

    const grouped =
      new Map<string, number[]>();

    for (const p of prices) {
      if (!grouped.has(p.deliveryZoneId)) {
        grouped.set(
          p.deliveryZoneId,
          [],
        );
      }

      grouped
        .get(p.deliveryZoneId)!
        .push(Number(p.price));
    }

    const storeMax = Math.max(
      ...(grouped.get(storeZoneId) ?? []),
      0,
    );

    const clientMax = Math.max(
      ...(grouped.get(clientZoneId) ?? []),
      0,
    );

    const finalPrice = Math.max(
      storeMax,
      clientMax,
    );

    if (finalPrice <= 0) {
      throw new BadRequestException(
        'Ruta no tarifada',
      );
    }

    return finalPrice;
  }
}