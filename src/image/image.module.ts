// src/modules/image/image.module.ts
import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module'; // Importa el BusinessModule
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImageController } from './controllers/image.controller';
import { ImageService } from './services/image.service';

@Module({
  imports: [
    PrismaModule, // Importa el módulo de Prisma para usar PrismaService
    BusinessModule, // Importa el BusinessModule para usar BusinessService
  ],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService], // Exporta ImageService si otros módulos lo necesitarán (ej. BusinessService)
})
export class ImageModule {}