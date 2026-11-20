import {
  Injectable,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';

// ==========================================
// TYPES
// ==========================================

export type DemandLevel =
  | 'NORMAL'
  | 'ELEVATED'
  | 'HIGH'
  | 'CRITICAL';

export type WeatherLevel =
  | 'NORMAL'
  | 'ADVERSE'
  | 'VERY_ADVERSE';

export type DistanceCalculationMethod =
  | 'OSRM'
  | 'HAVERSINE';

export interface PricingSegment {
  untilKm: number | null;
  incrementKm: number;
  incrementPrice: number;
}

/**
 * Configuración comercial de la tarifa.
 *
 * Es propiedad de la mensajería.
 * Puede existir una configuración general y acuerdos
 * comerciales particulares para determinados negocios.
 */
export interface DynamicPricingConfig {
  version: string;

  // Tarifa base
  baseDistanceKm: number;
  basePrice: number;
  segments: PricingSegment[];

  // Adicionales dinámicos
  demand: Record<DemandLevel, number>;
  weather: Record<WeatherLevel, number>;

  // Protección del cálculo
  maxAdditionalPercentage: number;
  roundingUnit: number;
}

/**
 * Reglas operativas de la mensajería.
 *
 * No forman parte de los acuerdos comerciales
 * particulares de cada negocio.
 */
export interface OperationalConfig {
  maxOperationalKm: number;
}

/**
 * Acuerdo comercial particular.
 *
 * La mensajería administra estos valores.
 * El negocio no puede modificarlos.
 *
 * Por ahora se obtiene de un objeto hardcodeado.
 * Más adelante se consultará desde la base de datos.
 */
export interface BusinessPricingAgreement {
  version: string;
  baseDistanceKm: number;
  basePrice: number;
  segments: PricingSegment[];
}

export interface PricingConditions {
  demandLevel: DemandLevel;
  weatherLevel: WeatherLevel;
  serviceSuspended: boolean;
}

export type PricingSource =
  | 'BUSINESS_AGREEMENT'
  | 'DEFAULT';

/**
 * Resultado de la obtención de distancia.
 *
 * measuredDistanceKm:
 * - OSRM: distancia vial devuelta por OSRM.
 * - HAVERSINE: distancia Haversine multiplicada por el factor
 *   de aproximación urbana (1.3).
 *
 * distanceKm:
 * distancia que efectivamente se utiliza para calcular la tarifa.
 */
export interface DistanceCalculationResult {
  distanceKm: number;
  measuredDistanceKm: number;
  method: DistanceCalculationMethod;
  adjustmentKm: number;
}

export interface PricingResult {
  businessId: string;

  price: number;
  basePrice: number;

  // Distancia final utilizada para calcular el precio.
  distanceKm: number;

  // Trazabilidad del cálculo de distancia.
  measuredDistanceKm: number;
  distanceCalculationMethod: DistanceCalculationMethod;
  distanceAdjustmentKm: number;

  demandLevel: DemandLevel;
  demandPercentage: number;

  weatherLevel: WeatherLevel;
  weatherPercentage: number;

  appliedAdditionalPercentage: number;

  pricingSource: PricingSource;
  configVersion: string;

  calculatedAt: Date;
}

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================

export const DEFAULT_PRICING_CONFIG: DynamicPricingConfig = {
  version: '1.2.0',

  // Tarifa mínima hasta 500 metros.
  baseDistanceKm: 0.5,
  basePrice: 1500,

  segments: [
    {
      // De 0,5 km a 1,5 km.
      untilKm: 1.5,
      incrementKm: 0.5,
      incrementPrice: 300,
    },
    {
      // De 1,5 km a 2 km.
      untilKm: 2,
      incrementKm: 0.5,
      incrementPrice: 400,
    },
    {
      // De 2 km a 5 km.
      untilKm: 5,
      incrementKm: 0.5,
      incrementPrice: 400,
    },
    {
      // Más de 5 km.
      untilKm: null,
      incrementKm: 0.5,
      incrementPrice: 500,
    },
  ],

  demand: {
    NORMAL: 0,
    ELEVATED: 15,
    HIGH: 30,
    CRITICAL: 50,
  },

  weather: {
    NORMAL: 0,
    ADVERSE: 15,
    VERY_ADVERSE: 30,
  },

  maxAdditionalPercentage: 80,
  roundingUnit: 50,
};

/**
 * Configuración operativa general.
 *
 * En el futuro también puede venir de la base de datos,
 * pero siempre será administrada por la mensajería.
 */
export const DEFAULT_OPERATIONAL_CONFIG: OperationalConfig = {
  maxOperationalKm: 20.5,
};

// ==========================================
// HARDCODED BUSINESS AGREEMENTS
// ==========================================

/**
 * Acuerdos comerciales particulares por negocio.
 *
 * La clave es el businessId.
 *
 * Si un negocio no aparece en este objeto,
 * se utiliza DEFAULT_PRICING_CONFIG.
 *
 * Importante:
 * Este objeto lo administra la mensajería.
 * No es una configuración editable por el negocio.
 */
const HARDCODED_BUSINESS_PRICING_AGREEMENTS:
  Record<string, BusinessPricingAgreement> = {
    // 'ID_DEL_NEGOCIO': {
    //   version: 'agreement-1',
    //   baseDistanceKm: 2,
    //   basePrice: 2800,
    //   segments: [
    //     {
    //       untilKm: 5,
    //       incrementKm: 0.5,
    //       incrementPrice: 300,
    //     },
    //     {
    //       untilKm: null,
    //       incrementKm: 0.5,
    //       incrementPrice: 300,
    //     },
    //   ],
    // },
  };

// ==========================================
// SERVICE
// ==========================================

@Injectable()
export class DeliveryPriceCalculatorKmService {
  private readonly LONG_TTL = 15552000000; // 6 meses

  private readonly OSRM_URL =
    process.env.OSRM_URL ||
    'https://router.project-osrm.org';

  /**
   * Ajuste aplicado exclusivamente cuando OSRM no está disponible
   * y se utiliza Haversine como alternativa.
   */
  private readonly HAVERSINE_ADJUSTMENT_KM = 0.5;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ==========================================
  // MAIN ORCHESTRATOR
  // ==========================================

  async calculate(
    businessId: string,
    storeAddressId: string,
    clientLat: number,
    clientLng: number,
    conditions: PricingConditions,
  ) {
    // 1. Validar identificadores y coordenadas.
    if (!businessId || !storeAddressId) {
      throw new BadRequestException(
        'El negocio y la dirección son obligatorios',
      );
    }

    this.validateCoordinates(clientLat, clientLng);

    // 2. Obtener configuración comercial del negocio.
    const {
      config,
      pricingSource,
    } = this.getPricingConfigForBusiness(businessId);

    // 3. Validar configuración.
    this.validatePricingConfig(config);

    // 4. Obtener configuración operativa.
    const operationalConfig =
      DEFAULT_OPERATIONAL_CONFIG;

    // 5. Obtener ubicación del negocio.
    const storeCoords =
      await this.getStoreCoords(storeAddressId);

    // 6. Calcular distancia y conservar su procedencia.
    const distanceResult =
      await this.getDistanceKmWithCache(
        storeCoords.lat,
        storeCoords.lng,
        clientLat,
        clientLng,
      );

    // No redondeamos la distancia.
    // Si se utilizó Haversine, distanceKm ya incluye los 500 m.
    const distanceKm = distanceResult.distanceKm;

    // 7. Validar cobertura operativa usando la distancia efectiva.
    if (
      distanceKm >
      operationalConfig.maxOperationalKm
    ) {
      throw new BadRequestException(
        'Destino fuera de nuestra zona de cobertura operativa.',
      );
    }

    // 8. Calcular tarifa base con distancia real.
    const basePrice = this.evaluateBasePricing(
      distanceKm,
      config,
    );

    // 9. Aplicar adicionales dinámicos.
    const pricing = this.evaluateDynamicPricing(
      basePrice,
      conditions,
      config,
    );

    // 10. Construir resultado.
    const result: PricingResult = {
      businessId,

      price: pricing.finalPrice,
      basePrice,

      distanceKm,
      measuredDistanceKm: distanceResult.measuredDistanceKm,
      distanceCalculationMethod: distanceResult.method,
      distanceAdjustmentKm: distanceResult.adjustmentKm,

      demandLevel: conditions.demandLevel,
      demandPercentage: pricing.demandPercentage,

      weatherLevel: conditions.weatherLevel,
      weatherPercentage: pricing.weatherPercentage,

      appliedAdditionalPercentage:
        pricing.appliedAdditionalPercentage,

      pricingSource,
      configVersion: config.version,

      calculatedAt: new Date(),
    };

    return {
      ...result,

      storeCoords,

      clientCoords: {
        lat: clientLat,
        lng: clientLng,
      },
    };
  }

  // ==========================================
  // PRICING CONFIG RESOLUTION
  // ==========================================

  /**
   * Resuelve qué tarifa debe utilizarse para el negocio.
   *
   * Prioridad:
   * 1. Acuerdo comercial particular.
   * 2. Configuración general por defecto.
   *
   * Actualmente consulta un objeto hardcodeado.
   * En el futuro este método será reemplazado por
   * una consulta a la base de datos.
   *
   * El resto del servicio no necesita conocer
   * de dónde proviene la configuración.
   */
  private getPricingConfigForBusiness(
    businessId: string,
  ): {
    config: DynamicPricingConfig;
    pricingSource: PricingSource;
  } {
    const agreement =
      HARDCODED_BUSINESS_PRICING_AGREEMENTS[
        businessId
      ];

    // Si existe un acuerdo particular,
    // se utiliza su tarifa base.
    if (agreement) {
      const config: DynamicPricingConfig = {
        ...DEFAULT_PRICING_CONFIG,

        version: agreement.version,

        baseDistanceKm: agreement.baseDistanceKm,
        basePrice: agreement.basePrice,

        segments: agreement.segments.map(
          (segment) => ({ ...segment }),
        ),
      };

      return {
        config,
        pricingSource: 'BUSINESS_AGREEMENT',
      };
    }

    // Si no existe acuerdo,
    // se utiliza la configuración por defecto.
    const defaultConfig: DynamicPricingConfig = {
      ...DEFAULT_PRICING_CONFIG,

      demand: {
        ...DEFAULT_PRICING_CONFIG.demand,
      },

      weather: {
        ...DEFAULT_PRICING_CONFIG.weather,
      },

      segments:
        DEFAULT_PRICING_CONFIG.segments.map(
          (segment) => ({ ...segment }),
        ),
    };

    return {
      config: defaultConfig,
      pricingSource: 'DEFAULT',
    };
  }

  // ==========================================
  // BASE PRICING
  // ==========================================

  private evaluateBasePricing(
    distanceKm: number,
    config: DynamicPricingConfig,
  ): number {
    if (
      !Number.isFinite(distanceKm) ||
      distanceKm < 0
    ) {
      throw new BadRequestException(
        'Distancia inválida para calcular el envío',
      );
    }

    // La tarifa mínima cubre la distancia incluida.
    if (distanceKm <= config.baseDistanceKm) {
      return config.basePrice;
    }

    let currentPrice = config.basePrice;
    let currentDistance = config.baseDistanceKm;

    for (const segment of config.segments) {
      const segmentEnd = segment.untilKm ?? Infinity;

      const distanceInSegment =
        Math.min(distanceKm, segmentEnd) - currentDistance;

      if (distanceInSegment <= 0) {
        continue;
      }

      // Incremento proporcional a la distancia real.
      const pricePerKm =
        segment.incrementPrice / segment.incrementKm;

      currentPrice += distanceInSegment * pricePerKm;

      currentDistance = Math.min(distanceKm, segmentEnd);

      if (distanceKm <= segmentEnd) {
        break;
      }
    }

    if (
      !Number.isFinite(currentPrice) ||
      currentPrice <= 0 ||
      currentDistance < distanceKm
    ) {
      throw new BadRequestException(
        'Error al evaluar la tarifa por kilometraje',
      );
    }

    return currentPrice;
  }

  // ==========================================
  // DYNAMIC PRICING
  // ==========================================

  private evaluateDynamicPricing(
    basePrice: number,
    conditions: PricingConditions,
    config: DynamicPricingConfig,
  ) {
    // Validar suspensión del servicio.
    if (conditions.serviceSuspended) {
      throw new BadRequestException(
        'El servicio de delivery se encuentra suspendido por condiciones operativas o climáticas.',
      );
    }

    // Validar niveles recibidos.
    if (
      !Object.prototype.hasOwnProperty.call(
        config.demand,
        conditions.demandLevel,
      ) ||
      !Object.prototype.hasOwnProperty.call(
        config.weather,
        conditions.weatherLevel,
      )
    ) {
      throw new BadRequestException(
        'Las condiciones de demanda o clima no son válidas',
      );
    }

    const demandPercentage =
      config.demand[conditions.demandLevel];

    const weatherPercentage =
      config.weather[conditions.weatherLevel];

    // Los adicionales se suman, no se multiplican.
    const appliedAdditionalPercentage =
      Math.min(
        demandPercentage + weatherPercentage,
        config.maxAdditionalPercentage,
      );

    // Aplicar adicionales sobre la tarifa base.
    const calculatedPrice =
      basePrice *
      (1 + appliedAdditionalPercentage / 100);

    // Se redondea el IMPORTE, no la distancia.
    const finalPrice =
      Math.round(
        calculatedPrice / config.roundingUnit,
      ) * config.roundingUnit;

    if (
      !Number.isFinite(finalPrice) ||
      finalPrice <= 0
    ) {
      throw new BadRequestException(
        'Error al evaluar el precio dinámico',
      );
    }

    return {
      finalPrice,
      demandPercentage,
      weatherPercentage,
      appliedAdditionalPercentage,
    };
  }

  // ==========================================
  // CONFIGURATION VALIDATION
  // ==========================================

  private validatePricingConfig(
    config: DynamicPricingConfig,
  ): void {
    if (
      !config ||
      !config.version ||
      !Number.isFinite(config.baseDistanceKm) ||
      config.baseDistanceKm < 0 ||
      !Number.isFinite(config.basePrice) ||
      config.basePrice <= 0 ||
      !Number.isFinite(
        config.maxAdditionalPercentage,
      ) ||
      config.maxAdditionalPercentage < 0 ||
      !Number.isFinite(config.roundingUnit) ||
      config.roundingUnit <= 0 ||
      !Array.isArray(config.segments) ||
      !config.demand ||
      !config.weather
    ) {
      throw new BadRequestException(
        'Configuración tarifaria inválida',
      );
    }

    let previousLimit = config.baseDistanceKm;

    for (
      let i = 0;
      i < config.segments.length;
      i++
    ) {
      const segment = config.segments[i];

      if (
        !Number.isFinite(segment.incrementKm) ||
        segment.incrementKm <= 0 ||
        !Number.isFinite(segment.incrementPrice) ||
        segment.incrementPrice < 0
      ) {
        throw new BadRequestException(
          'Configuración de tramo tarifario inválida',
        );
      }

      if (segment.untilKm !== null) {
        if (
          !Number.isFinite(segment.untilKm) ||
          segment.untilKm <= previousLimit
        ) {
          throw new BadRequestException(
            'Los límites de los tramos tarifarios deben ser crecientes',
          );
        }

        previousLimit = segment.untilKm;
      } else if (
        i !== config.segments.length - 1
      ) {
        throw new BadRequestException(
          'El tramo ilimitado debe ser el último',
        );
      }
    }

    if (
      config.segments.length === 0 ||
      config.segments[
        config.segments.length - 1
      ].untilKm !== null
    ) {
      throw new BadRequestException(
        'La configuración debe cubrir todas las distancias mediante un último tramo ilimitado',
      );
    }

    // Validar que existan todos los niveles esperados.
    const demandLevels: DemandLevel[] = [
      'NORMAL',
      'ELEVATED',
      'HIGH',
      'CRITICAL',
    ];

    const weatherLevels: WeatherLevel[] = [
      'NORMAL',
      'ADVERSE',
      'VERY_ADVERSE',
    ];

    for (const level of demandLevels) {
      const percentage = config.demand[level];

      if (
        !Number.isFinite(percentage) ||
        percentage < 0
      ) {
        throw new BadRequestException(
          'Configuración de demanda inválida',
        );
      }
    }

    for (const level of weatherLevels) {
      const percentage = config.weather[level];

      if (
        !Number.isFinite(percentage) ||
        percentage < 0
      ) {
        throw new BadRequestException(
          'Configuración climática inválida',
        );
      }
    }
  }

  // ==========================================
  // COORDINATE VALIDATION
  // ==========================================

  private validateCoordinates(
    latitude: number,
    longitude: number,
  ): void {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'Coordenadas del destino inválidas',
      );
    }
  }

  // ==========================================
  // STORE COORDINATES
  // ==========================================

  private async getStoreCoords(
    storeAddressId: string,
  ): Promise<{
    lat: number;
    lng: number;
  }> {
    const storeKey =
      `store_coords:${storeAddressId}`;

    const cached =
      await this.cacheManager.get<{
        lat: number;
        lng: number;
      }>(storeKey);

    if (cached) {
      return cached;
    }

    const storeAddress =
      await this.prisma.address.findUnique({
        where: {
          id: storeAddressId,
        },
        select: {
          latitude: true,
          longitude: true,
        },
      });

    if (
      storeAddress?.latitude == null ||
      storeAddress?.longitude == null
    ) {
      throw new BadRequestException(
        'Ubicación del negocio no válida',
      );
    }

    const coords = {
      lat: Number(storeAddress.latitude),
      lng: Number(storeAddress.longitude),
    };

    this.validateCoordinates(
      coords.lat,
      coords.lng,
    );

    await this.cacheManager.set(
      storeKey,
      coords,
      this.LONG_TTL,
    );

    return coords;
  }

  // ==========================================
  // ROUTE DISTANCE + CACHE
  // ==========================================

  public async getDistanceKmWithCache(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<DistanceCalculationResult> {
    // v2 evita reutilizar entradas antiguas que guardaban
    // únicamente un número y no identificaban el método.
    //
    // Se usan 6 decimales para reducir colisiones entre
    // coordenadas cercanas.
    const routeKey =
      `route_dist:v2:${lat1.toFixed(6)},${lon1.toFixed(6)}:` +
      `${lat2.toFixed(6)},${lon2.toFixed(6)}`;

    const cached =
      await this.cacheManager.get<DistanceCalculationResult>(
        routeKey,
      );

    if (
      cached &&
      Number.isFinite(cached.distanceKm) &&
      Number.isFinite(cached.measuredDistanceKm) &&
      Number.isFinite(cached.adjustmentKm) &&
      (cached.method === 'OSRM' ||
        cached.method === 'HAVERSINE')
    ) {
      return cached;
    }

    let result: DistanceCalculationResult;

    try {
      const url =
        `${this.OSRM_URL}/route/v1/driving/` +
        `${lon1},${lat1};${lon2},${lat2}?overview=false`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `OSRM HTTP error: ${response.status}`,
        );
      }

      const data = (await response.json()) as {
        code?: string;
        routes?: Array<{
          distance: number;
        }>;
      };

      if (
        data.code !== 'Ok' ||
        !data.routes ||
        data.routes.length === 0 ||
        !Number.isFinite(data.routes[0].distance) ||
        data.routes[0].distance < 0
      ) {
        throw new Error(
          'Ruta no encontrada en OSRM',
        );
      }

      // OSRM devuelve distancia vial en metros.
      const measuredDistanceKm =
        data.routes[0].distance / 1000;

      result = {
        distanceKm: measuredDistanceKm,
        measuredDistanceKm,
        method: 'OSRM',
        adjustmentKm: 0,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error desconocido';

      console.warn(
        'OSRM no disponible, aplicando fallback Haversine:',
        message,
      );

      // Haversine con factor de aproximación urbana 1.3.
      const measuredDistanceKm =
        this.calculateHaversineUrbanKm(
          lat1,
          lon1,
          lat2,
          lon2,
        );

      // Adicional de 500 metros exclusivamente para fallback.
      const adjustmentKm =
        this.HAVERSINE_ADJUSTMENT_KM;

      result = {
        measuredDistanceKm,
        adjustmentKm,
        distanceKm: measuredDistanceKm + adjustmentKm,
        method: 'HAVERSINE',
      };
    }

    if (
      !Number.isFinite(result.distanceKm) ||
      result.distanceKm < 0
    ) {
      throw new BadRequestException(
        'No se pudo determinar una distancia válida para el envío',
      );
    }

    await this.cacheManager.set(
      routeKey,
      result,
      this.LONG_TTL,
    );

    return result;
  }

  // ==========================================
  // HAVERSINE FALLBACK
  // ==========================================

  private calculateHaversineUrbanKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;

    const dLat =
      (lat2 - lat1) * (Math.PI / 180);

    const dLon =
      (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      );

    // Aproximación urbana, no distancia vial exacta.
    return R * c * 1.3;
  }

  // ==========================================
  // BUSINESS ENTRY POINT
  // ==========================================

  async calculateForBusiness(
    businessId: string,
    clientLat: number,
    clientLng: number,
    conditions: PricingConditions,
  ) {
    if (!businessId) {
      throw new BadRequestException(
        'El identificador del negocio es obligatorio',
      );
    }

    // Obtener la dirección del negocio.
    const storeAddress =
      await this.prisma.address.findFirst({
        where: {
          businessId,
        },
        select: {
          id: true,
        },
      });

    if (!storeAddress) {
      throw new BadRequestException(
        'No se encontró una dirección para el negocio',
      );
    }

    return this.calculate(
      businessId,
      storeAddress.id,
      clientLat,
      clientLng,
      conditions,
    );
  }
}
