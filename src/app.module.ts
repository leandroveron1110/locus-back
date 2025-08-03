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
import { OfferedServiceModule } from './offered-service/offered-service.module';
import { RatingModule } from './rating/rating.module';
import { SearchModule } from './search/search.module';
import { UploadsModule } from './uploads/uploads.module';
import { IsBusinessIdExistsConstraint } from './common/validators/is-business-id-exists.validator';
import { FollowModule } from './follow/follow.module';
import { MenuModule } from './menu/menu.module';
import { MenuProductModule } from './menu-product/menu-product.module';
import { OrderModule } from './order/order.module';

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
    OfferedServiceModule,
    RatingModule,
    SearchModule,
    UploadsModule,
    FollowModule,
    MenuModule,
    MenuProductModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService, IsBusinessIdExistsConstraint],
})
export class AppModule {}
