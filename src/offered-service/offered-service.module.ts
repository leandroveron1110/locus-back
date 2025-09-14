// src/modules/offered-service/offered-service.module.ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module'; // Para validar businessId
import { PrismaModule } from 'src/prisma/prisma.module';
import { OfferedServiceController } from './controllers/offered-service.controller';
import { OfferedServiceService } from './services/offered-service.service';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  imports: [
    PrismaModule, // Necesario para la interacción con la base de datos
    BusinessModule, // Necesario para validar la existencia del negocio
  ],
  controllers: [OfferedServiceController],
  providers: [
    {
      provide: TOKENS.IOfferedServiceSerice,
      useClass: OfferedServiceService
    }
  ],
  exports: [TOKENS.IOfferedServiceSerice], // Exporta el servicio si otros módulos (ej. Booking) necesitan usarlo
})
export class OfferedServiceModule {}