// src/delivery-zones/delivery-zones.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { DeliveryZone, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryZoneDto } from '../dtos/request/delivery-zone.dto';
import { UpdateDeliveryZoneDto } from '../dtos/request/update-delivery-zone.dto';
import { PriceResult } from '../dtos/response/delivery-zone-price';
import { ZoneManagementService } from './zone-zanagement.service';

// Define el tipo para la geometría GeoJSON
type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Injectable()
export class DeliveryZonesService {
  constructor(
    private prisma: PrismaService,
    private zoneManagementService: ZoneManagementService,
  ) {}

  async create(data: CreateDeliveryZoneDto) {
    const geometry: Prisma.InputJsonValue = {
      type: data.geometry.type,
      coordinates: data.geometry.coordinates,
    };

    const res = await this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        price: 0,
        deliveryCompanyId: data.companyId,
        geometry,
        hasTimeLimit: data.hasTimeLimit,
        startTime: data.startTime,
        endTime: data.endTime,
      },
      select: {
        id: true,
      },
    });

    if (data.priceMatrix) {
      const priceMatrixData = data.priceMatrix.map((entry) => ({
        companyId: data.companyId,
        barrioId: res.id,
        macroId: entry.macroZoneId,
        price: entry.price,
      }));
      await this.zoneManagementService.savePriceMatrix(priceMatrixData);
    }
  }

  // --- Método para editar una zona de entrega (actualización parcial) ---
  async update(id: string, data: UpdateDeliveryZoneDto) {
    const { priceMatrices, ...form} = data
    const zone = await this.prisma.deliveryZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Delivery zone with ID ${id} not found.`);
    }

    const updateData: Prisma.DeliveryZoneUpdateInput = {
      ...form,
      price: 0,
    };

    await this.prisma.deliveryZone.update({
      where: { id },
      data: updateData,
    });

    if (priceMatrices) {
      const priceMatrixData = priceMatrices.map((entry) => ({
        companyId: zone.deliveryCompanyId,
        barrioId: id,
        macroId: entry.macroZoneId,
        price: entry.price,
      }));
      await this.zoneManagementService.savePriceMatrix(priceMatrixData);
    }

    return id;
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

  async getZonesByDeliveryCompany(companyId: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        deliveryCompanyId: companyId,
      },
      select: {
        id: true,
        name: true,
        geometry: true,
        isActive: true,
        hasTimeLimit: true,
        startTime: true,
        endTime: true,
        priceMatrices: {
          select: {
            deliveryCompanyId: true,
            deliveryZoneId: true,
            macroZoneId: true,
            price: true,
          },
        },
      },
    });

    return zones;
  }
}
