import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async followBusiness(userId: string, businessId: string) {
    // Verificar si ya sigue
    const exists = await this.prisma.businessFollower.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
    });

    if (exists) {
      throw new BadRequestException('Ya estás siguiendo este negocio');
    }

    return this.prisma.businessFollower.create({
      data: { userId, businessId },
    });
  }

  async unfollowBusiness(userId: string, businessId: string) {
    // Verificar si existe la relación
    const exists = await this.prisma.businessFollower.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
    });

    if (!exists) {
      throw new NotFoundException('No sigues este negocio');
    }

    return this.prisma.businessFollower.delete({
      where: {
        userId_businessId: { userId, businessId },
      },
    });
  }

  async getFollowedBusinesses(userId: string) {
    return this.prisma.businessFollower.findMany({
      where: { userId },
      select: { businessId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBusinessFollowers(businessId: string) {
    return this.prisma.businessFollower.findMany({
      where: { businessId },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFollowing(userId: string, businessId: string): Promise<boolean> {
    const follow = await this.prisma.businessFollower.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
    });
    return !!follow;
  }
}
