import { Module } from '@nestjs/common';
import { BusinessPaymentMethodsService } from './services/business-payment-methods.service';
import { BusinessPaymentMethodsController } from './controllers/business-payment-methods.controller';

@Module({
  controllers: [BusinessPaymentMethodsController],
  providers: [BusinessPaymentMethodsService],
})
export class BusinessPaymentMethodsModule {}
