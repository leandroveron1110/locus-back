import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterResponseDto } from 'src/cash-register/dtos/cash-register/cash-register-response.dto';
import { CreateCashRegisterDto } from 'src/cash-register/dtos/cash-register/create-cash-register.dto';
import { UpdateCashRegisterDto } from 'src/cash-register/dtos/cash-register/update-cash-register.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // MAPPER
  // ============================================================

  private toResponseDto(cashRegister: {
    id: string;
    idTemp: string | null;
    businessId: string;
    name: string;
    defaultTreasuryAccountId: string;
    defaultTreasuryAccountIdTemp: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CashRegisterResponseDto {
    return {
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      businessId: cashRegister.businessId,
      name: cashRegister.name,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp: cashRegister.defaultTreasuryAccountIdTemp,
      isActive: cashRegister.isActive,
      createdAt: cashRegister.createdAt,
      updatedAt: cashRegister.updatedAt,
    };
  }

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  async create(input: CreateCashRegisterDto) {
    // Idempotencia mediante idTemp
    if (input.idTemp) {
      const existing = await this.prisma.cashRegister.findUnique({
        where: {
          idTemp: input.idTemp,
        },
      });

      if (existing) {
        return existing;
      }
    }

    // Verificar que la cuenta de tesorería exista
    const treasuryAccount = await this.prisma.treasuryAccount.findUnique({
      where: {
        idTemp: input.defaultTreasuryAccountId,
      },
    });

    if (!treasuryAccount) {
      throw new NotFoundException('La cuenta de tesorería no existe');
    }

    // La cuenta debe pertenecer al mismo negocio
    if (treasuryAccount.businessId !== input.businessId) {
      throw new NotFoundException(
        'La cuenta de tesorería no pertenece al negocio',
      );
    }

    // La cuenta por defecto de una caja debe ser CASH
    if (treasuryAccount.type !== 'CASH') {
      throw new NotFoundException(
        'La cuenta de tesorería por defecto debe ser de tipo CASH',
      );
    }

    const cashRegister = await this.prisma.cashRegister.create({
      data: {
        idTemp: input.idTemp,
        businessId: input.businessId,
        name: input.name.trim(),

        // ID definitivo utilizado por Prisma.
        defaultTreasuryAccountId: treasuryAccount.id,

        // ID temporal utilizado por sincronización.
        defaultTreasuryAccountIdTemp: input.defaultTreasuryAccountId,

        isActive: input.isActive ?? true,
      },
    });

    return this.toResponseDto({
      businessId: cashRegister.businessId,
      createdAt: cashRegister.createdAt,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp:
        cashRegister.defaultTreasuryAccountIdTemp || '',
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      isActive: cashRegister.isActive,
      name: cashRegister.name,
      updatedAt: cashRegister.updatedAt,
    });
  }

  // --------------------------------------------------
  // FIND ALL
  // --------------------------------------------------

  async findAll(businessId: string): Promise<CashRegisterResponseDto[]> {
    const cashRegisters = await this.prisma.cashRegister.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return cashRegisters.map((cashRegister) =>
      this.toResponseDto({
      businessId: cashRegister.businessId,
      createdAt: cashRegister.createdAt,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp:
        cashRegister.defaultTreasuryAccountIdTemp || '',
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      isActive: cashRegister.isActive,
      name: cashRegister.name,
      updatedAt: cashRegister.updatedAt,
    }),
    );
  }

  // --------------------------------------------------
  // FIND ONE
  // --------------------------------------------------

  async findOne(id: string) {
    const cashRegister =
      await this.prisma.cashRegister.findUnique({
        where: {
          id,
        },
      });

    if (!cashRegister) {
      throw new NotFoundException('La caja no existe');
    }

    return this.toResponseDto({
      businessId: cashRegister.businessId,
      createdAt: cashRegister.createdAt,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp:
        cashRegister.defaultTreasuryAccountIdTemp || '',
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      isActive: cashRegister.isActive,
      name: cashRegister.name,
      updatedAt: cashRegister.updatedAt,
    });
  }

  // --------------------------------------------------
  // FIND BY ID TEMP
  // --------------------------------------------------

  async findByIdTemp(idTemp: string) {
    const cashRegister =
      await this.prisma.cashRegister.findUnique({
        where: {
          idTemp,
        },
      });

    if (!cashRegister) {
      return null;
    }

    return this.toResponseDto({
      businessId: cashRegister.businessId,
      createdAt: cashRegister.createdAt,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp:
        cashRegister.defaultTreasuryAccountIdTemp || '',
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      isActive: cashRegister.isActive,
      name: cashRegister.name,
      updatedAt: cashRegister.updatedAt,
    });
  }

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  async update(id: string, input: UpdateCashRegisterDto) {
    const existing = await this.prisma.cashRegister.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('La caja no existe');
    }

    // Si cambia la cuenta de tesorería,
    // validamos la nueva cuenta.
    if (
      input.defaultTreasuryAccountId &&
      input.defaultTreasuryAccountId !== existing.defaultTreasuryAccountId
    ) {
      const treasuryAccount = await this.prisma.treasuryAccount.findUnique({
        where: {
          id: input.defaultTreasuryAccountId,
        },
      });

      if (!treasuryAccount) {
        throw new NotFoundException('La cuenta de tesorería no existe');
      }

      if (treasuryAccount.businessId !== existing.businessId) {
        throw new NotFoundException(
          'La cuenta de tesorería no pertenece al negocio',
        );
      }

      if (treasuryAccount.type !== 'CASH') {
        throw new NotFoundException(
          'La cuenta de tesorería por defecto debe ser de tipo CASH',
        );
      }
    }

    const cashRegister = await this.prisma.cashRegister.update({
      where: {
        id,
      },
      data: {
        ...(input.name !== undefined && {
          name: input.name.trim(),
        }),

        ...(input.defaultTreasuryAccountId !== undefined && {
          defaultTreasuryAccountId: input.defaultTreasuryAccountId,
        }),

        ...(input.isActive !== undefined && {
          isActive: input.isActive,
        }),
      },
      include: {
        defaultTreasuryAccount: true,
      },
    });

    return this.toResponseDto({
      businessId: cashRegister.businessId,
      createdAt: cashRegister.createdAt,
      defaultTreasuryAccountId: cashRegister.defaultTreasuryAccountId,
      defaultTreasuryAccountIdTemp:
        cashRegister.defaultTreasuryAccountIdTemp || '',
      id: cashRegister.id,
      idTemp: cashRegister.idTemp,
      isActive: cashRegister.isActive,
      name: cashRegister.name,
      updatedAt: cashRegister.updatedAt,
    });
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  async toggleActive(id: string) {
    const existing = await this.prisma.cashRegister.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('La caja no existe');
    }

    return this.prisma.cashRegister.update({
      where: {
        id,
      },
      data: {
        isActive: !existing.isActive,
      },
    });
  }

  // --------------------------------------------------
  // REMOVE
  // --------------------------------------------------

  async remove(id: string) {
    const existing = await this.prisma.cashRegister.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('La caja no existe');
    }

    return this.prisma.cashRegister.delete({
      where: {
        id,
      },
    });
  }
}
