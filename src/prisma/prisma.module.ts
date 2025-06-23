import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Esto hace que PrismaService esté disponible en toda la aplicación sin importarlo en cada módulo.
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta PrismaService para que otros módulos lo puedan inyectar.
})
export class PrismaModule {}