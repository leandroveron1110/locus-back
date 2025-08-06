// src/modules/image/image.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { BusinessModule } from '../business/business.module'; // Importa el BusinessModule
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImageController } from './controllers/image.controller';
import { ImageService } from './services/image.service';
import { TOKENS } from 'src/common/constants/tokens';
import { UploadsModule } from 'src/uploads/uploads.module';

@Module({
  imports: [
    PrismaModule, // Importa el módulo de Prisma para usar PrismaService
    UploadsModule
  ],
  controllers: [ImageController],
  providers: [
    {
      provide: TOKENS.IImageService,
      useClass: ImageService
    }
  ],
  exports: [TOKENS.IImageService], // Exporta ImageService si otros módulos lo necesitarán (ej. BusinessService)
})
export class ImageModule {}