import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderValidationService } from './services/validations/order-validation.service';
import { BusinessModule } from 'src/business/business.module';
import { MenuModule } from 'src/menu/menu.module';
import { MenuProductModule } from 'src/menu-product/menu-product.module';
import { OrderGateway } from './services/socket/order-gateway';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderValidationService, OrderGateway],
  imports: [
    BusinessModule,
    MenuModule,
    MenuProductModule
  ],
  exports: [OrderGateway, OrderService]
})
export class OrderModule {}
