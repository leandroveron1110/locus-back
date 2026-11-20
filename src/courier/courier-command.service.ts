// courier-command.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CourierStatus, Prisma, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeCourierPasswordDto } from './dto/change-courier-password.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';

const COURIER_SAFE_SELECT = {
  id: true,
  dni: true,
  mustChangePassword: true,
  fullName: true,
  phone: true,
  vehicleType: true,
  status: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CourierSelect;

@Injectable()
export class CourierCommandService {
  private readonly saltRounds = 10;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourierDto) {
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    try {
      return await this.prisma.courier.create({
        data: {
          dni: dto.dni.trim(),
          passwordHash,
          mustChangePassword: true,
          courierNumber: dto.courierNumber ? dto.courierNumber : undefined,
          fullName: dto.fullName.trim(),
          phone: dto.phone?.trim() || null,
          vehicleType: dto.vehicleType ?? VehicleType.MOTORCYCLE,
          status: CourierStatus.ACTIVE,
          isAvailable: false, // Empieza fuera de turno hasta que marque que está trabajando
        },
        select: COURIER_SAFE_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('courierNumber')) {
          throw new ConflictException(
            'Ya existe un cadete con ese número de móvil',
          );
        }
        throw new ConflictException('Ya existe un cadete con ese DNI');
      }
    }
  }

  async update(id: string, dto: UpdateCourierDto) {
    const exists = await this.prisma.courier.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Cadete no encontrado');
    }

    return this.prisma.courier.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
        ...(dto.vehicleType !== undefined && { vehicleType: dto.vehicleType }),
        ...(dto.status !== undefined && {
          status: dto.status,
          ...(dto.status !== CourierStatus.ACTIVE && { isAvailable: false }),
        }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      select: COURIER_SAFE_SELECT,
    });
  }

  // Trabajando / disponible o dejó de trabajar
  async setWorkingState(id: string, isAvailable: boolean) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!courier) {
      throw new NotFoundException('Cadete no encontrado');
    }

    if (isAvailable && courier.status !== CourierStatus.ACTIVE) {
      throw new BadRequestException(
        'El cadete no está habilitado para trabajar',
      );
    }

    return this.prisma.courier.update({
      where: { id },
      data: { isAvailable },
      select: COURIER_SAFE_SELECT,
    });
  }

  async changePassword(id: string, dto: ChangeCourierPasswordDto) {
    const exists = await this.prisma.courier.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Cadete no encontrado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);

    return this.prisma.courier.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      select: COURIER_SAFE_SELECT,
    });
  }

  async login(dni: string, password: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { dni: dni.trim() },
      select: {
        ...COURIER_SAFE_SELECT,
        passwordHash: true,
      },
    });

    if (!courier || courier.status !== CourierStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Credenciales inválidas o cuenta inactiva',
      );
    }

    const isValid = await bcrypt.compare(password, courier.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { passwordHash: _removed, ...safeCourier } = courier;
    return safeCourier;
  }
}
