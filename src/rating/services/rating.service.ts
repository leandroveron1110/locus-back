import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRatingDto } from '../dtos/request/create-rating.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserService } from 'src/users/interfaces/User-service.interface';
import { ISearchableBusinessCrudService } from 'src/search/interfaces/searchable-business-crud-service.interface';

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKENS.IUserService)
    private readonly userService: IUserService,
    @Inject(TOKENS.ISearchableBusinessCrudService)
    private readonly searchableBusinessCrudService: ISearchableBusinessCrudService,
  ) {}

  /**
   * Crea o actualiza un rating para un negocio dado por un usuario.
   * Si ya existe → lo actualiza.
   * Si no existe → lo crea.
   */
  async rate(dto: CreateRatingDto, userId: string) {
    const { businessId, value, comment } = dto;

    const rating = await this.prisma.rating.upsert({
      where: { businessId_userId: { businessId, userId } },
      update: { value, comment },
      create: { businessId, userId, value, comment },
    });

    await this.updateBusinessRating(businessId);
    return rating;
  }

  private async updateBusinessRating(businessId: string) {
    const result = await this.prisma.rating.aggregate({
      where: { businessId },
      _avg: { value: true },
      _count: true,
    });

    const average = result._avg.value ?? 0;
    const count = result._count;

    await Promise.all([
      this.prisma.business.update({
        where: { id: businessId },
        data: {
          averageRating: result._avg.value ?? null,
          ratingsCount: count,
        },
      }),
      this.searchableBusinessCrudService.update({
        id: businessId,
        reviewCount: count,
        averageRating: average,
      }),
    ]);
  }

  async getSummaryByBusinessId(businessId: string) {
    const result = await this.prisma.rating.aggregate({
      where: { businessId },
      _avg: { value: true },
      _count: true,
    });

    return {
      averageRating: result._avg.value
        ? Number(result._avg.value.toFixed(1))
        : 0,
      ratingsCount: result._count,
    };
  }

  async getCommentsByBusinessId(businessId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { businessId, comment: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const users = await Promise.all(
      userIds.map((id) => this.userService.findById(id)),
    );
    const usersMap = new Map(users.map((u) => [u.id, u]));

    return ratings.map((r) => ({
      id: r.id,
      comment: r.comment,
      value: r.value,
      user: {
        id: r.userId,
        fullName: `${usersMap.get(r.userId)?.firstName ?? ''} ${
          usersMap.get(r.userId)?.lastName ?? ''
        }`.trim(),
      },
    }));
  }
}
