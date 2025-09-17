// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
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
import { AddressModule } from './address/address.module';
import { SocketModule } from './socket/socket.module';
import { DeliveryModule } from './delivery/delivery.module';
import { BusinessPaymentMethodsModule } from './business-payment-methods/business-payment-methods.module';
import { DeliveryZonesModule } from './delivery-zones/delivery-zones.module';
import { EmployeesModule } from './employees/employees.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RBACGuard } from './auth/guards/rbac.guard'; // Importa el nuevo RBACGuard


@Module({
  imports: [
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
    AddressModule,
    SocketModule,
    DeliveryModule,
    BusinessPaymentMethodsModule,
    DeliveryZonesModule,
    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    IsBusinessIdExistsConstraint,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Este guard se ejecuta primero
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard, // Este guard se ejecuta después
    },
  ],
})
export class AppModule {}