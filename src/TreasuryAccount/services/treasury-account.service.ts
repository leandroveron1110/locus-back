// treasury-account/treasury-account.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTreasuryAccountDto } from '../dtos/create-treasury-account.dto';
import { UpdateTreasuryAccountDto } from '../dtos/update-treasury-account.dto';

@Injectable()
export class TreasuryAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTreasuryAccountDto) {
    const existing = await this.prisma.treasuryAccount.findUnique({
      where: {
        idTemp: input.idTemp,
      },
    });

    // Idempotencia:
    // si el worker vuelve a enviar el mismo registro,
    // no creamos una segunda cuenta.
    if (existing) {
      return existing;
    }

    return this.prisma.treasuryAccount.create({
      data: {
        idTemp: input.idTemp,
        businessId: input.businessId,
        name: input.name,
        type: input.type,
        currency: input.currency,
        currentBalance: input.currentBalance,
        isActive: input.isActive,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.treasuryAccount.findUnique({
      where: {
        id,
      },
    });
  }

  async findByIdTemp(idTemp: string) {
    return this.prisma.treasuryAccount.findUnique({
      where: {
        idTemp,
      },
    });
  }

  async findByBusinessId(businessId: string) {
    return this.prisma.treasuryAccount.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(input: UpdateTreasuryAccountDto) {
    return this.prisma.treasuryAccount.update({
      where: {
        idTemp: input.idTemp,
      },
      data: {
        ...(input.name !== undefined && {
          name: input.name,
        }),

        ...(input.type !== undefined && {
          type: input.type,
        }),

        ...(input.currency !== undefined && {
          currency: input.currency,
        }),

        ...(input.currentBalance !== undefined && {
          currentBalance: input.currentBalance,
        }),

        ...(input.isActive !== undefined && {
          isActive: input.isActive,
        }),

        updatedAt: input.updatedAt ?? new Date(),
      },
    });
  }

  async toggleActive(idTemp: string) {
    const account = await this.findByIdTemp(idTemp);

    if (!account) {
      throw new Error('Treasury account not found');
    }

    return this.prisma.treasuryAccount.update({
      where: {
        idTemp,
      },
      data: {
        isActive: !account.isActive,
      },
    });
  }
}
