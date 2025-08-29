// src/delivery-zones/delivery-zones.service.ts

import { Injectable } from '@nestjs/common';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { DeliveryZone, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';

// Define el tipo para la geometría GeoJSON
type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Injectable()
export class DeliveryZonesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDeliveryZoneDto): Promise<DeliveryZone> {
    const geometry: Prisma.InputJsonValue = {
      type: data.geometry.type,
      coordinates: data.geometry.coordinates,
    };
    return this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        price: data.price,
        deliveryCompanyId: data.companyId,
        geometry,
      },
    });
  }

  async calculatePrice(
    companyId: string,
    lat: number,
    lng: number,
  ): Promise<number | null> {
    const customerPoint = point([lng, lat]);
    const zones = await this.prisma.deliveryZone.findMany({
      where: { deliveryCompanyId: companyId },
    });

    for (const zone of zones) {
      // Usar aserción de tipo para tratar 'geometry' como un objeto GeoJSON
      const geometry = zone.geometry as GeoJsonPolygon;

      if (geometry && geometry.type === 'Polygon' && geometry.coordinates) {
        const zonePolygon = polygon(geometry.coordinates);

        if (booleanPointInPolygon(customerPoint, zonePolygon)) {
          return Number(zone.price);
        }
      }
    }
    return null;
  }
}
