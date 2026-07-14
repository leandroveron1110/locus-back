import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { IDeliveryPriceRepository } from './delivery-price.repository';
import {
  ClientZoneData,
  StoreZoneData,
} from './delivery-price.types';

import { PrismaDeliveryPriceRepository } from './prisma-delivery-price.repository';

@Injectable()
export class CachedDeliveryPriceRepository
  implements IDeliveryPriceRepository
{
  private readonly TTL = 60 * 60 * 24 * 180; // 180 días

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,

    private readonly prismaRepository: PrismaDeliveryPriceRepository,
  ) {}

  /**
   * Obtiene la zona del negocio.
   */
  async getStoreZone(
    storeAddressId: string,
  ): Promise<StoreZoneData> {
    const key = `store-zone:${storeAddressId}`;

    const cached =
      await this.cache.get<StoreZoneData>(key);

    if (cached) {
      return cached;
    }

    const result =
      await this.prismaRepository.getStoreZone(
        storeAddressId,
      );

    await this.cache.set(
      key,
      result,
      this.TTL,
    );

    return result;
  }

  /**
   * Obtiene la zona del cliente.
   */
  async getClientZone(
    lat: number,
    lng: number,
  ): Promise<ClientZoneData> {

    // El H3 es determinístico y barato de calcular.
    const h3 = require('h3-js').latLngToCell(
      lat,
      lng,
      9,
    );

    const key = `client-zone:${h3}`;

    const cached =
      await this.cache.get<ClientZoneData>(
        key,
      );

    if (cached) {
      return cached;
    }

    const result =
      await this.prismaRepository.getClientZone(
        lat,
        lng,
      );

    await this.cache.set(
      key,
      result,
      this.TTL,
    );

    return result;
  }

  /**
   * Obtiene el precio entre zonas.
   */
  async getPrice(
    deliveryCompanyId: string,
    storeZoneId: string,
    clientZoneId: string,
  ): Promise<number> {

    const key =
      `price:${deliveryCompanyId}:${storeZoneId}:${clientZoneId}`;

    const cached =
      await this.cache.get<number>(key);

    if (cached !== undefined) {
      return cached;
    }

    const result =
      await this.prismaRepository.getPrice(
        deliveryCompanyId,
        storeZoneId,
        clientZoneId,
      );

    await this.cache.set(
      key,
      result,
      this.TTL,
    );

    return result;
  }
}