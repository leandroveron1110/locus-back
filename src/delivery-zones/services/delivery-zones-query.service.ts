import { Injectable } from "@nestjs/common";
import { PriceResult } from "../dtos/response/delivery-zone-price";
import { point, polygon } from '@turf/helpers';
import { PrismaService } from "src/prisma/prisma.service";
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { CompanyDeliveryWithPrice } from "../dtos/response/CompanyDeliveryWithPrice";


// Define el tipo para la geometría GeoJSON
type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Injectable()
export class DeliveryZonesQueryService {

  constructor(private prisma: PrismaService) {}

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


    // Nuevo método en tu servicio (o uno similar al useCompanyDelivery)
// que se llamará una sola vez al cargar la pantalla de selección.
async getAvailableCompaniesWithPrices(lat: number, lng: number): Promise<CompanyDeliveryWithPrice[]> {
  // 1. Obtener TODAS las compañías disponibles (o las relevantes).
  const allCompanies = await this.prisma.deliveryCompany.findMany({
    where: {
      isActive: true
    },
    select: { id: true, name: true, phone: true },
  });

  const results: CompanyDeliveryWithPrice[] = [];

  // 2. Iterar sobre CADA compañía y llamar a tu función de cálculo
  for (const company of allCompanies) {
    const priceResult = await this.calculatePrice(company.id, lat, lng);
    
    
    // 3. (OPCIONAL) Omitir compañías si el precio es NULL
    if (priceResult.price === null && priceResult.message?.includes("no cubre esta zona")) {
        // Ignorar compañías que no cubren la zona
        continue;
    }

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
}