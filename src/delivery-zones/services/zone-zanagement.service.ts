import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ZoneManagementService {
  constructor(private prisma: PrismaService) {}

  // --- 1. Crear MacroZonas (Plaza, Cementerio) ---
  // Estas son globales de la ciudad, no pertenecen a una empresa específica [cite: 199]
  async createMacroZone(name: string, geometry: any) {
    return this.prisma.macroZone.create({
      data: { name, geometry, isActive: true },
    });
  }

  async getMacroZonesIds() {
    const rest = await this.prisma.macroZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    return rest;
  }
  // --- 2. Crear Barrios (Delivery Zones) ---
  // IMPORTANTE: Aquí vinculamos el barrio a la empresa
  async createBarrio(name: string, geometry: any, deliveryCompanyId: string) {
    return this.prisma.deliveryZone.create({
      data: {
        name,
        geometry,
        deliveryCompanyId, // <--- El campo que faltaba
        isActive: true,
        price: 0, // Valor por defecto, el real se define en la Matrix [cite: 195]
      },
    });
  }

  // --- 3. Configurar la Matriz de Precios ---
  // Relaciona Empresa + Destino + Origen
  async setPrice(dto: {
    companyId: string;
    barrioId: string;
    macroId: string;
    price: number;
  }) {
    return this.prisma.deliveryPriceMatrix.upsert({
      where: {
        deliveryCompanyId_deliveryZoneId_macroZoneId: {
          deliveryCompanyId: dto.companyId,
          deliveryZoneId: dto.barrioId,
          macroZoneId: dto.macroId,
        },
      },
      update: { price: dto.price },
      create: {
        deliveryCompanyId: dto.companyId,
        deliveryZoneId: dto.barrioId,
        macroZoneId: dto.macroId,
        price: dto.price,
      },
    });
  }

  async savePriceMatrix(
    dto: {
      companyId: string;
      barrioId: string;
      macroId: string;
      price: number;
    }[],
  ) {
    return await this.prisma.$transaction(
      dto.map((item) =>
        this.prisma.deliveryPriceMatrix.upsert({
          where: {
            deliveryCompanyId_deliveryZoneId_macroZoneId: {
              deliveryCompanyId: item.companyId,
              deliveryZoneId: item.barrioId,
              macroZoneId: item.macroId,
            },
          },
          update: { price: item.price },
          create: {
            deliveryCompanyId: item.companyId,
            deliveryZoneId: item.barrioId,
            macroZoneId: item.macroId,
            price: item.price,
          },
        }),
      ),
    );
  }
}
