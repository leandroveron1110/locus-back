// courier-query.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { CourierStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const COURIER_SAFE_SELECT = {
  id: true,
  courierNumber: true,
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
export class CourierQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      select: COURIER_SAFE_SELECT,
    });

    if (!courier) {
      throw new NotFoundException("Cadete no encontrado");
    }

    return courier;
  }

  async findAll() {
    return this.prisma.courier.findMany({
      select: COURIER_SAFE_SELECT,
      orderBy: [{ courierNumber: "asc" }],
    });
  }

  async findWorkingCouriers() {
    return this.prisma.courier.findMany({
      where: {
        status: CourierStatus.ACTIVE,
        isAvailable: true,
      },
      select: COURIER_SAFE_SELECT,
      orderBy: { fullName: "asc" },
    });
  }
}