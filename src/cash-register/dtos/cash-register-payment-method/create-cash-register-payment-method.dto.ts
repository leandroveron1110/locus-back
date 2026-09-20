import { PaymentMethodTypeFinancial } from '@prisma/client';

export interface CreateCashRegisterPaymentMethodDto {
  // Identidad local del registro
  idTemp?: string;

  businessId: string;

  // Identidad local de la caja
  cashRegisterIdTemp: string;

  paymentMethod: PaymentMethodTypeFinancial;

  // Identidad local de la cuenta de tesorería
  treasuryAccountIdTemp: string;

  isActive?: boolean;
}