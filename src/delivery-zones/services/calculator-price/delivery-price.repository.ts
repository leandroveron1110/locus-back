// delivery-price.repository.ts

import {
  ClientZoneData,
  StoreZoneData,
} from './delivery-price.types';

export interface IDeliveryPriceRepository {

  /**
   * Obtiene la zona donde se encuentra el negocio.
   */
  getStoreZone(
    storeAddressId: string,
  ): Promise<StoreZoneData>;

  /**
   * Obtiene la zona donde se encuentra el cliente.
   */
  getClientZone(
    lat: number,
    lng: number,
  ): Promise<ClientZoneData>;

  /**
   * Obtiene el precio entre dos zonas.
   */
  getPrice(
    deliveryCompanyId: string,
    storeZoneId: string,
    clientZoneId: string,
  ): Promise<number>;
}