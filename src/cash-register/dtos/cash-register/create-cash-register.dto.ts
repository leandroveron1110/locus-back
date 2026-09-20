// dto/create-cash-register.dto.ts

export interface CreateCashRegisterDto {
  idTemp?: string | null;
  businessId: string;
  name: string;
  defaultTreasuryAccountId: string;
  isActive: boolean
}