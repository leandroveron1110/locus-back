// src/modules/status/status.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StatusController } from './controllers/status.controller';
import { StatusService } from './services/status.service';

@Module({
  imports: [
    PrismaModule, // Importa el módulo de Prisma para usar PrismaService
  ],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService], // Exporta StatusService para que otros módulos puedan usarlo
})
export class StatusModule {}