// src/delivery-zones/delivery-zones.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { DeliveryZone, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';
import { UpdateDeliveryZoneDto } from '../dtos/request/update-delivery-zone.dto';
import { PriceResult } from '../dtos/response/delivery-zone-price';

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
        hasTimeLimit: data.hasTimeLimit,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  }

  // --- Método para editar una zona de entrega (actualización parcial) ---
  async update(id: string, data: UpdateDeliveryZoneDto): Promise<DeliveryZone> {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Delivery zone with ID ${id} not found.`);
    }

    const updateData: Prisma.DeliveryZoneUpdateInput = {
      ...data,
      price:
        data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
    };

    return this.prisma.deliveryZone.update({
      where: { id },
      data: updateData,
    });
  }

  // --- Método para eliminar una zona de entrega ---
  async remove(id: string): Promise<DeliveryZone> {
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Delivery zone with ID ${id} not found.`);
    }

    return this.prisma.deliveryZone.delete({
      where: { id },
    });
  }

  async calculatePrice(
    companyId: string,
    lat: number,
    lng: number,
  ): Promise<PriceResult> {
    const customerPoint = point([lng, lat]);

    const companyName = await this.prisma.deliveryCompany.findUnique({where: {id: companyId}, select: {name: true}});

    if(!companyName) {
      throw new Error(`Cadeteria no encontrada`)
    }

    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        deliveryCompanyId: companyId,
        isActive: true,
      },
    });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    for (const zone of zones) {
      const geometry = zone.geometry as GeoJsonPolygon;

      if (geometry && geometry.type === 'Polygon' && geometry.coordinates) {
        const zonePolygon = polygon(geometry.coordinates);

        if (booleanPointInPolygon(customerPoint, zonePolygon)) {
          // Si tiene límite de horario, verificamos
          if (zone.hasTimeLimit && zone.startTime && zone.endTime) {
            const isWithinSchedule =
              currentTime >= zone.startTime && currentTime <= zone.endTime;

            if (!isWithinSchedule) {
              return {
                price: null,
                message: `Fuera de horario de trabajo para la zona "${zone.name}". Horario: ${zone.startTime} - ${zone.endTime}`,
              };
            }
          }

          return {
            price: Number(zone.price),
            message: `Dentro de la zona "${zone.name}"`,
          };
        }
      }
    }

    return {
      price: null,
      message: `La cadetería "${companyName.name}" no cubre esta zona. Por favor elija otra ubicación o cadetería.` 
    };
  }

  async getZonesByDeliberyCompany(companyId: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        deliveryCompanyId: companyId,
      },
      select: {
        id: true,
        name: true,
        price: true,
        geometry: true,
        isActive: true,
        hasTimeLimit: true,
        startTime: true,
        endTime: true,
      },
    });

    return zones;
  }
}
