// dto/update-cash-register.dto.ts

export interface UpdateCashRegisterDto {
  id: string;
  businessId: string;
  name?: string;
  defaultTreasuryAccountId?: string;
  isActive?: boolean;
}