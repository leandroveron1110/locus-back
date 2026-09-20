// treasury-account/dto/update-treasury-account.dto.ts

import { TreasuryAccountType } from "@prisma/client";

export interface UpdateTreasuryAccountDto {
  idTemp: string;

  name?: string;
  type?: TreasuryAccountType;
  currency?: string;
  currentBalance?: number;
  isActive?: boolean;

  updatedAt?: Date;
}