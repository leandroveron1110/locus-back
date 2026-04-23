import { Injectable } from '@nestjs/common';
import { PriceResult } from '../dtos/response/delivery-zone-price';
import { point, polygon } from '@turf/helpers';
import { PrismaService } from 'src/prisma/prisma.service';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { CompanyDeliveryWithPrice } from '../dtos/response/CompanyDeliveryWithPrice';
import { AddressIndexingService } from './address-indexing.service';

// Define el tipo para la geometría GeoJSON
type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Injectable()
export class DeliveryZonesQueryService {
  constructor(private prisma: PrismaService, private addressIndexingService: AddressIndexingService) {}

  async calculatePrice(
    companyId: string,
    customerLat: number,
    customerLng: number,
    businessLat: number,
    businessLng: number,
  ): Promise<PriceResult> {
    const company = await this.prisma.deliveryCompany.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (!company) throw new Error(`Cadetería no encontrada`);

    const zones = await this.prisma.deliveryZone.findMany({
      where: { deliveryCompanyId: companyId, isActive: true },
    });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Validamos punto del cliente
    const customerZone = this.findZoneForPoint(
      zones,
      customerLat,
      customerLng,
      currentTime,
    );
    // Validamos punto del negocio
    const businessZone = this.findZoneForPoint(
      zones,
      businessLat,
      businessLng,
      currentTime,
    );

    // CASO 1: El cliente está fuera de zona o de horario
    if (customerZone.error) {
      return {
        idCompany: companyId,
        price: null,
        message: `Punto de entrega: ${customerZone.error}`,
      };
    }

    // CASO 2: El negocio está fuera de zona o de horario
    if (businessZone.error) {
      return {
        idCompany: companyId,
        price: null,
        message: `Punto de retiro (negocio): ${businessZone.error}`,
      };
    }

    // CASO 3: Ambos están cubiertos. Elegimos el precio más alto.
    const finalPrice = Math.max(customerZone.price, businessZone.price);

    return {
      idCompany: companyId,
      price: finalPrice,
      message: `Cobertura total. Precio basado en la zona más lejana (${finalPrice}).`,
    };
  }

  // En DeliveryZonesQueryService
async calculatePricePure(
  zones: any[], 
  customerLat: number,
  customerLng: number,
  businessLat: number,
  businessLng: number,
): Promise<Omit<PriceResult, 'idCompany'>> {
  const now = new Date();
  // Forzamos el horario a formato HH:mm
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // IMPORTANTE: Limpiamos las zonas que vienen del queryRaw
  const cleanedZones = zones.map(zone => ({
    ...zone,
    // Si el geometry viene como string (común en Raw SQL), lo parseamos
    geometry: typeof zone.geometry === 'string' ? JSON.parse(zone.geometry) : zone.geometry,
    // Nos aseguramos que el precio sea un número
    price: Number(zone.price)
  }));

  // Validaciones en memoria
  const customerZone = this.findZoneForPoint(cleanedZones, customerLat, customerLng, currentTime);
  const businessZone = this.findZoneForPoint(cleanedZones, businessLat, businessLng, currentTime);

  if (customerZone.error) {
    return { price: null, message: `Punto de entrega: ${customerZone.error}` };
  }

  if (businessZone.error) {
    return { price: null, message: `Punto de retiro (negocio): ${businessZone.error}` };
  }

  // Elegimos el más caro (lógica de doble zona)
  const finalPrice = Math.max(customerZone.price, businessZone.price);

  return {
    price: finalPrice,
    message: `Cobertura total. Tarifa: ${finalPrice}.`,
  };
}

  /**
   * Función auxiliar para encontrar una zona y validar horario para un punto específico
   */
  private findZoneForPoint(
    zones: any[],
    lat: number,
    lng: number,
    currentTime: string,
  ): { price: number; error?: string } {
    const p = point([Number(lng), Number(lat)]);

    console.log('Validando punto:', { lat, lng }, 'en zonas:', zones.map(z => ({ id: z.id, name: z.name })));

    for (const zone of zones) {
      const geometry = zone.geometry as GeoJsonPolygon;
      if (geometry && geometry.type === 'Polygon') {
        const zonePolygon = polygon(geometry.coordinates);

        if (booleanPointInPolygon(p, zonePolygon)) {
          // Validar Horario
          if (zone.hasTimeLimit && zone.startTime && zone.endTime) {
            const isWithinSchedule =
              currentTime >= zone.startTime && currentTime <= zone.endTime;
            if (!isWithinSchedule) {
              return {
                price: 0,
                error: `Fuera de horario en zona "${zone.name}" (${zone.startTime}-${zone.endTime})`,
              };
            }
          }
          return { price: Number(zone.price) };
        }
      }
    }

    return { price: 0, error: 'Ubicación fuera de área de cobertura' };
  }

  // Actualización del método masivo
  async getAvailableCompaniesWithPrices(
    customerLat: number,
    customerLng: number,
    businessLat: number,
    businessLng: number,
  ): Promise<CompanyDeliveryWithPrice[]> {
    const allCompanies = await this.prisma.deliveryCompany.findMany({
      where: { isActive: true },
      select: { id: true, name: true, phone: true },
    });

    const results: CompanyDeliveryWithPrice[] = [];

    for (const company of allCompanies) {
      const priceResult = await this.calculatePrice(
        company.id,
        customerLat,
        customerLng,
        businessLat,
        businessLng,
      );

      if (priceResult.price === null) continue;

      results.push({
        idCompany: company.id,
        name: company.name,
        phone: company.phone,
        price: priceResult.price,
        priceMessage: priceResult.message,
      });
    }

    return results;
  }

  async getAutoDeliveryPrice(
    businessId: string,
    clientAddressId: string,
  ): Promise<PriceResult> {
    // 1. Obtener la única compañía de mensajería activa
    const company = await this.prisma.deliveryCompany.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    if (!company) {
      return { idCompany: '', price: null, message: 'No hay ninguna empresa de mensajería disponible en este momento.' };
    }

    // 2. Obtener las coordenadas del negocio (desde su dirección)
    const businessAddress = await this.prisma.address.findFirst({
      where: { 
        businessId: businessId,
        // Asumiendo que el negocio tiene una dirección principal o de retiro
      },
      select: { id: true }
    });



    if (!businessAddress ) {
      throw new Error(`El negocio no tiene una ubicación configurada para calcular el envío.`);
    }

    const result =  await this.addressIndexingService.getDeliveryPrice(businessAddress.id, clientAddressId, company.id);
    // 3. Reutilizar la lógica de cálculo de doble zona
    return {
      idCompany: company.id,
      price: result.finalPrice,
      message: `Precio calculado automáticamente basado en la ubicación del negocio y el cliente. ${result.finalPrice > 0 ? 'Tarifa aplicada.' : 'No hay tarifa configurada para este trayecto.'}`,
    };
  }

  async getAllZonesForCompany(companyId: string) {
    return this.prisma.deliveryZone.findMany({
      where: { deliveryCompanyId: companyId },
      select: {
        id: true,
        name: true,
      }
    });
  }

  async getMacroZones() {
    return this.prisma.macroZone.findMany({
      where: { isActive: true },
    });
    }
}
