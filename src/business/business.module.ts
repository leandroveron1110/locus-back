import { forwardRef, Module } from '@nestjs/common';
import { BusinessController } from './controllers/business.controller';
import { BusinessService } from './services/business.service';
import { CategoriesModule } from 'src/categories/categories.module';
import { TargsModule } from 'src/targs/targs.module';
import { BusinessGalleryService } from './services/images/business-gallery.service';
import { BusinessLogoService } from './services/images/business-logo.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { StatusModule } from 'src/status/status.module';
import { ImageModule } from 'src/image/image.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { BusinessGalleryController } from './controllers/business-gallery.controller';
import { BusinessLogoController } from './controllers/business-logo.controller';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  controllers: [
    BusinessController,
    BusinessGalleryController,
    BusinessLogoController,
  ],
  providers: [
    {
      provide: TOKENS.IBusinessService,
      useClass: BusinessService
    }
    , BusinessGalleryService, BusinessLogoService],
  imports: [
    CategoriesModule,
    TargsModule,
    PrismaModule,
    UsersModule,
    StatusModule,
    forwardRef(() => ImageModule),
    UploadsModule,
  ],
  exports: [TOKENS.IBusinessService],
})
export class BusinessModule {}
