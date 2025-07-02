// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; // ¡Importa tu nuevo AuthModule!
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TargsModule } from './targs/targs.module';
import { BusinessModule } from './business/business.module';
import { ImageModule } from './image/image.module';
import { StatusModule } from './status/status.module';
import { WeeklyScheduleModule } from './weekly-schedule/weekly-schedule.module';
import { MenuSectionModule } from './menu-section/menu-section.module';
import { OfferedServiceModule } from './offered-service/offered-service.module';
import { ProductModule } from './product/product.module';
import { BookingModule } from './booking/booking.module';
import { EventModule } from './event/event.module';
import { RatingModule } from './rating/rating.module';
import { SpecialScheduleModule } from './special-schedule/special-schedule.module';
import { SearchModule } from './search/search.module';
import { UploadsModule } from './uploads/uploads.module';
import { IsBusinessIdExistsConstraint } from './common/validators/is-business-id-exists.validator';

@Module({
  imports: [
    // Carga las variables de entorno desde un archivo .env
    // isGlobal: true hace que ConfigService esté disponible en toda la aplicación
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TargsModule,
    BusinessModule,
    ImageModule,
    StatusModule,
    WeeklyScheduleModule,
    MenuSectionModule,
    OfferedServiceModule,
    ProductModule,
    BookingModule,
    EventModule,
    RatingModule,
    SpecialScheduleModule,
    SearchModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService, IsBusinessIdExistsConstraint],
})
export class AppModule {}
