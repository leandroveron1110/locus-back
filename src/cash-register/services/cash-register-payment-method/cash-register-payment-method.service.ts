import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateCashRegisterPaymentMethodDto } from 'src/cash-register/dtos/cash-register-payment-method/create-cash-register-payment-method.dto';
import { UpdateCashRegisterPaymentMethodDto } from 'src/cash-register/dtos/cash-register-payment-method/update-cash-register-payment-method.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CashRegisterPaymentMethodService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateCashRegisterPaymentMethodDto) {
    // ----------------------------------------------------------
    // IDEMPOTENCIA
    // ----------------------------------------------------------

    if (dto.idTemp) {
      const existing =
        await this.prisma.cashRegisterPaymentMethod.findUnique({
          where: {
            idTemp: dto.idTemp,
          },
        });

      if (existing) {
        return existing;
      }
    }

    // ----------------------------------------------------------
    // VALIDAR CAJA POR idTemp
    // ----------------------------------------------------------

    const cashRegister =
      await this.prisma.cashRegister.findUnique({
        where: {
          idTemp: dto.cashRegisterIdTemp,
        },
      });

    if (!cashRegister) {
      throw new NotFoundException(
        'La caja no existe',
      );
    }

    // ----------------------------------------------------------
    // VALIDAR TESORERÍA POR idTemp
    // ----------------------------------------------------------

    const treasuryAccount =
      await this.prisma.treasuryAccount.findUnique({
        where: {
          idTemp: dto.treasuryAccountIdTemp,
        },
      });

    if (!treasuryAccount) {
      throw new NotFoundException(
        'La cuenta de tesorería no existe',
      );
    }

    // ----------------------------------------------------------
    // VALIDAR QUE PERTENEZCAN AL MISMO NEGOCIO
    // ----------------------------------------------------------

    if (cashRegister.businessId !== dto.businessId) {
      throw new ConflictException(
        'La caja no pertenece al negocio indicado',
      );
    }

    if (treasuryAccount.businessId !== dto.businessId) {
      throw new ConflictException(
        'La cuenta de tesorería no pertenece al negocio indicado',
      );
    }

    // ----------------------------------------------------------
    // EVITAR DUPLICADO
    // ----------------------------------------------------------

    const existingPaymentMethod =
      await this.prisma.cashRegisterPaymentMethod.findUnique({
        where: {
          cashRegisterId_paymentMethod: {
            cashRegisterId: cashRegister.id,
            paymentMethod: dto.paymentMethod,
          },
        },
      });

    if (existingPaymentMethod) {
      throw new ConflictException(
        'Este medio de pago ya está configurado en esta caja',
      );
    }

    // ----------------------------------------------------------
    // CREAR
    // ----------------------------------------------------------

    return this.prisma.cashRegisterPaymentMethod.create({
      data: {
        idTemp: dto.idTemp,

        businessId: dto.businessId,

        // FK real
        cashRegisterId: cashRegister.id,

        // ID local de la relación
        cashRegisterIdTemp: dto.cashRegisterIdTemp,

        paymentMethod: dto.paymentMethod,

        // FK real
        treasuryAccountId: treasuryAccount.id,

        // ID local de la relación
        treasuryAccountIdTemp:
          dto.treasuryAccountIdTemp,

        isActive: dto.isActive ?? true,
      },
    });
  }

  // ============================================================
  // FIND BY ID
  // ============================================================

  async findById(id: string) {
    const paymentMethod =
      await this.prisma.cashRegisterPaymentMethod.findUnique({
        where: {
          id,
        },
      });

    if (!paymentMethod) {
      throw new NotFoundException(
        'El medio de pago de la caja no existe',
      );
    }

    return paymentMethod;
  }

  // ============================================================
  // FIND BY ID TEMP
  // ============================================================

  async findByIdTemp(idTemp: string) {
    const paymentMethod =
      await this.prisma.cashRegisterPaymentMethod.findUnique({
        where: {
          idTemp,
        },
      });

    if (!paymentMethod) {
      throw new NotFoundException(
        'El medio de pago de la caja no existe',
      );
    }

    return paymentMethod;
  }

  // ============================================================
  // FIND BY CASH REGISTER
  // ============================================================

  async findByCashRegisterId(
    cashRegisterId: string,
  ) {
    return this.prisma.cashRegisterPaymentMethod.findMany({
      where: {
        cashRegisterId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ============================================================
  // FIND BY CASH REGISTER ID TEMP
  // ============================================================

  async findByCashRegisterIdTemp(
    cashRegisterIdTemp: string,
  ) {
    return this.prisma.cashRegisterPaymentMethod.findMany({
      where: {
        cashRegisterIdTemp,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ============================================================
  // FIND BY BUSINESS
  // ============================================================

  async findByBusinessId(
    businessId: string,
  ) {
    return this.prisma.cashRegisterPaymentMethod.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateCashRegisterPaymentMethodDto,
  ) {
    const current = await this.findById(id);

    // ----------------------------------------------------------
    // SI CAMBIA LA CAJA
    // ----------------------------------------------------------

    let cashRegisterId = current.cashRegisterId;
    let cashRegisterIdTemp =
      current.cashRegisterIdTemp;

    if (dto.cashRegisterIdTemp !== undefined) {
      const cashRegister =
        await this.prisma.cashRegister.findUnique({
          where: {
            idTemp: dto.cashRegisterIdTemp,
          },
        });

      if (!cashRegister) {
        throw new NotFoundException(
          'La caja no existe',
        );
      }

      cashRegisterId = cashRegister.id;
      cashRegisterIdTemp =
        dto.cashRegisterIdTemp;
    }

    // ----------------------------------------------------------
    // SI CAMBIA LA TESORERÍA
    // ----------------------------------------------------------

    let treasuryAccountId =
      current.treasuryAccountId;

    let treasuryAccountIdTemp =
      current.treasuryAccountIdTemp;

    if (
      dto.treasuryAccountIdTemp !== undefined
    ) {
      const treasuryAccount =
        await this.prisma.treasuryAccount.findUnique({
          where: {
            idTemp: dto.treasuryAccountIdTemp,
          },
        });

      if (!treasuryAccount) {
        throw new NotFoundException(
          'La cuenta de tesorería no existe',
        );
      }

      treasuryAccountId =
        treasuryAccount.id;

      treasuryAccountIdTemp =
        dto.treasuryAccountIdTemp;
    }

    // ----------------------------------------------------------
    // VALIDAR DUPLICADO
    // ----------------------------------------------------------

    const paymentMethod =
      dto.paymentMethod ??
      current.paymentMethod;

    if (
      cashRegisterId !== current.cashRegisterId ||
      paymentMethod !== current.paymentMethod
    ) {
      const duplicate =
        await this.prisma.cashRegisterPaymentMethod.findFirst({
          where: {
            cashRegisterId,
            paymentMethod,
            NOT: {
              id,
            },
          },
        });

      if (duplicate) {
        throw new ConflictException(
          'Este medio de pago ya está configurado en esta caja',
        );
      }
    }

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    return this.prisma.cashRegisterPaymentMethod.update({
      where: {
        id,
      },

      data: {
        ...(dto.paymentMethod !== undefined && {
          paymentMethod:
            dto.paymentMethod,
        }),

        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),

        cashRegisterId,
        cashRegisterIdTemp,

        treasuryAccountId,
        treasuryAccountIdTemp,
      },
    });
  }

  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================

  async toggleActive(id: string) {
    const current = await this.findById(id);

    return this.prisma.cashRegisterPaymentMethod.update({
      where: {
        id,
      },
      data: {
        isActive: !current.isActive,
      },
    });
  }

  // ============================================================
  // REMOVE
  // ============================================================

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.cashRegisterPaymentMethod.delete({
      where: {
        id,
      },
    });
  }
}