// src/modules/status/status.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StatusController } from './controllers/status.controller';
import { StatusService } from './services/status.service';
import { TOKENS } from 'src/common/constants/tokens';
import { StatusExistenceValidator } from './services/status-existence.validator';

@Module({
  imports: [
    PrismaModule, // Importa el módulo de Prisma para usar PrismaService
  ],
  controllers: [StatusController],
  providers: [{
    provide: TOKENS.IStatusService,
    useClass: StatusService
  },
  {
    provide: TOKENS.IStatusValidator,
    useClass: StatusExistenceValidator
  }
],
  exports: [TOKENS.IStatusService, TOKENS.IStatusValidator], // Exporta StatusService para que otros módulos puedan usarlo
})
export class StatusModule {}