// treasury-account/dto/create-treasury-account.dto.ts

import { TreasuryAccountType } from "@prisma/client";

export interface CreateTreasuryAccountDto {
  idTemp: string;
  businessId: string;

  name: string;
  type: TreasuryAccountType;
  currency: string;
  currentBalance: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}