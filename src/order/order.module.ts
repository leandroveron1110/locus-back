import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { OrderValidationService } from './services/validations/order-validation.service';
import { BusinessModule } from 'src/business/business.module';
import { MenuModule } from 'src/menu/menu.module';
import { MenuProductModule } from 'src/menu-product/menu-product.module';
import { OrderGateway } from './services/socket/order-gateway';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  controllers: [OrderController],
  providers: [
    {
      provide: TOKENS.IOrderService,
      useClass: OrderService
    },
    {
      provide: TOKENS.IOrderGateway,
      useClass: OrderGateway
    },
    {
      provide: TOKENS.IOrderValidationService,
      useClass: OrderValidationService
    }],
  imports: [
    BusinessModule,
    MenuModule,
    MenuProductModule
  ],
  exports: [TOKENS.IOrderService, TOKENS.IOrderGateway]
})
export class OrderModule {}
