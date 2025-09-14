import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IFollowService } from '../interfaces/follow-service.interface';
import { Prisma } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { ISearchableBusinessCrudService } from 'src/search/interfaces/searchable-business-crud-service.interface';

@Injectable()
export class FollowService implements IFollowService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly businessSearchableService: ISearchableBusinessCrudService,
  ) {}

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

    await Promise.all([
      this.businessSearchableService.incrementFollowersCount(businessId, 1),
      this.prisma.businessFollower.create({
        data: {
          businessId: businessId,
          userId: userId,
        },
      }),
    ]);
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

    await Promise.all([
      this.businessSearchableService.decrementFollowersCount(businessId, 1),
      this.prisma.businessFollower.delete({
        where: {
          userId_businessId: { userId, businessId },
        },
      }),
    ]);
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

  async getBusinessFollowerCount(businessId: string): Promise<number> {
    return this.prisma.businessFollower.count({
      where: { businessId },
    });
  }

  async getFollowingCountByBusinessAndIsFollowingUser(
    userId: string,
    businessId: string,
  ): Promise<{
    isFollowing: boolean;
    count: number;
  }> {
    console.log(userId, '- -', businessId);
    const result = await this.prisma.$queryRaw<
      Array<{ isFollowing: boolean; count: number }>
    >(Prisma.sql`
  SELECT 
    COUNT(*) FILTER (WHERE "businessId" = ${businessId}) AS count,
    EXISTS (
      SELECT 1 
      FROM "BusinessFollower" 
      WHERE "businessId" = ${businessId} AND "userId" = ${userId}
    ) AS "isFollowing"
  FROM "BusinessFollower"
  WHERE "businessId" = ${businessId};
`);
    if (result && result.length > 0) {
      return {
        count: Number(result[0].count),
        isFollowing: Boolean(result[0].isFollowing),
      };
    }

    throw new Error(`Error con los Follower`);
  }
}
