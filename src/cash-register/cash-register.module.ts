import { Module } from '@nestjs/common';
import { CashRegisterRepository } from './repositories/cash-register.repository';
// import { FinancialMovementRepository } from './repositories/financial-movement.repository';
import { CashRegisterCommand } from './services/command/cash-register-command.service';
// import { FinancialMovementCommand } from './services/command/financial-movement-command.service';
import { CashRegisterQuery } from './services/query/cash-register-query.service';
// import { FinancialMovementQuery } from './services/query/financial-movement-query.service';
import { CashRegisterPaymentMethodController } from './controller/cash-register-payment-method/cash-register-payment-method.controller';
import { CashRegisterController } from './controller/cash-register/cash-register.controller';
import { CashRegisterPaymentMethodService } from './services/cash-register-payment-method/cash-register-payment-method.service';
import { CashRegisterService } from './services/cash-register/cash-register.service';

@Module({
  controllers: [CashRegisterPaymentMethodController, CashRegisterController],
  providers: [
    CashRegisterRepository,
    // FinancialMovementRepository,
    CashRegisterCommand,
    // FinancialMovementCommand,
    CashRegisterQuery,
    // FinancialMovementQuery,
    CashRegisterPaymentMethodService,
    CashRegisterService,
  ],
})
export class CashRegisterModule {}
