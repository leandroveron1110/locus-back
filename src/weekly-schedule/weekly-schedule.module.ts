// src/modules/weekly-schedule/weekly-schedule.module.ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module'; // Para validar businessId
import { PrismaModule } from 'src/prisma/prisma.module';
import { WeeklyScheduleController } from './controllers/weekly-schedule.controller';
import { WeeklyScheduleService } from './service/weekly-schedule.service';

@Module({
  imports: [
    PrismaModule, // Necesario para la interacción con la base de datos
    BusinessModule, // Necesario para validar la existencia del negocio
  ],
  controllers: [WeeklyScheduleController],
  providers: [WeeklyScheduleService],
  exports: [WeeklyScheduleService], // Exporta el servicio si otros módulos necesitan consultar horarios
})
export class WeeklyScheduleModule {}