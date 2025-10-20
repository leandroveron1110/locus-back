import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderValidationService } from './services/validations/order-validation.service';
import { BusinessModule } from 'src/business/business.module';
import { MenuModule } from 'src/menu/menu.module';
import { MenuProductModule } from 'src/menu-product/menu-product.module';
import { OrderGateway } from './services/socket/order-gateway';
import { TOKENS } from 'src/common/constants/tokens';
import { OrderCommandService } from './services/commands/order-command.service';
import { OrderQueryService } from './services/querys/order-query.service';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
  controllers: [OrderController],
  providers: [
    {
      provide: TOKENS.IOrderQueryService,
      useClass: OrderQueryService,
    },
    {
      provide: TOKENS.IOrderCreationService,
      useClass: OrderCommandService,
    },
    {
      provide: TOKENS.IOrderUpdateService,
      useClass: OrderCommandService,
    },
    {
      provide: TOKENS.IOrderDeleteService,
      useClass: OrderCommandService,
    },

    {
      provide: TOKENS.IOrderGateway,
      useClass: OrderGateway,
    },
    {
      provide: TOKENS.IOrderValidationService,
      useClass: OrderValidationService,
    },
  ],
  imports: [BusinessModule, MenuModule, MenuProductModule, LoggingModule],
  exports: [TOKENS.IOrderQueryService, TOKENS.IOrderGateway],
})
export class OrderModule {}
