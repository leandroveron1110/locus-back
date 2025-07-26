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
import { BusinessCategoryService } from './services/business-category.service';
import { BusinessValidatorService } from './services/validator/business-validator.service';
import { BusinessTagController } from './controllers/business-tag.controller';
import { BusinessTagService } from './services/business-tag.service';
import { BusinessCategoryController } from './controllers/business-category.controller';
import { WeeklyScheduleModule } from 'src/weekly-schedule/weekly-schedule.module';

@Module({
  controllers: [
    BusinessController,
    BusinessGalleryController,
    BusinessLogoController,
    BusinessTagController,
    BusinessCategoryController
  ],
  providers: [
    {
      provide: TOKENS.IBusinessService,
      useClass: BusinessService,
    },
    {
      provide: TOKENS.IBusinessGalleryService,
      useClass: BusinessGalleryService,
    },
    {
      provide: TOKENS.IBusinessLogoService,
      useClass: BusinessLogoService,
    },
    {
      provide: TOKENS.IBusinessCategoryService,
      useClass: BusinessCategoryService,
    },
    {
      provide: TOKENS.IBusinessValidator,
      useClass: BusinessValidatorService,
    },
    {
      provide: TOKENS.IBusinessTagService,
      useClass: BusinessTagService
    }
  ],
  imports: [
    CategoriesModule,
    TargsModule,
    PrismaModule,
    UsersModule,
    StatusModule,
    forwardRef(() =>WeeklyScheduleModule),
    forwardRef(() => ImageModule),
    UploadsModule,
  ],
  exports: [
    TOKENS.IBusinessService,
    TOKENS.IBusinessGalleryService,
    TOKENS.IBusinessLogoService,
    TOKENS.IBusinessCategoryService,
    TOKENS.IBusinessValidator,
    TOKENS.IBusinessTagService
  ],
})
export class BusinessModule {}
