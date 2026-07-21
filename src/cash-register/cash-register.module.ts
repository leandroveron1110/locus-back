import { Module } from '@nestjs/common';
import { CashRegisterController } from './controller/cash-register.controller';
import { CashRegisterRepository } from './repositories/cash-register.repository';
import { FinancialMovementRepository } from './repositories/financial-movement.repository';
import { CashRegisterCommand } from './services/command/cash-register-command.service';
import { FinancialMovementCommand } from './services/command/financial-movement-command.service';
import { CashRegisterQuery } from './services/query/cash-register-query.service';
import { FinancialMovementQuery } from './services/query/financial-movement-query.service';

@Module({
  controllers: [CashRegisterController],
  providers: [
    CashRegisterRepository,
    FinancialMovementRepository,
    CashRegisterCommand,
    FinancialMovementCommand,
    CashRegisterQuery,
    FinancialMovementQuery,
  ],
})
export class CashRegisterModule {}
