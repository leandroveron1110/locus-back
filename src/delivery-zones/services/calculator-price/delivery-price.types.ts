// delivery-price.types.ts

export interface DeliveryPriceResponse {
  price: number;
  zoneName: string;
  h3: string;
}

export interface StoreZoneData {
  zoneId: string;
  macroZoneId: string;
}

export interface ClientZoneData {
  zoneId: string;
  zoneName: string;
  h3: string;
}