import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRatingDto } from '../dtos/request/create-rating.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserService } from 'src/users/interfaces/User-service.interface';

@Injectable()
export class RatingService {
  constructor(
    private prisma: PrismaService,
    @Inject(TOKENS.IUserService)
    private readonly userService: IUserService,
  ) {}

  async create(createRatingDto: CreateRatingDto) {
    // Verificamos si el usuario ya calificó este negocio
    const existing = await this.prisma.rating.count({
      where: {
        businessId: createRatingDto.businessId,
        userId: createRatingDto.userId,
      },
    });

    if (existing > 0) {
      throw new Error('El usuario ya calificó este negocio');
    }

    const rating = await this.prisma.rating.create({
      data: {
        value: createRatingDto.value,
        comment: createRatingDto.comment,
        businessId: createRatingDto.businessId,
        userId: createRatingDto.userId,
      },
    });

    await this.updateBusinessRating(createRatingDto.businessId);

    return rating;
  }

  async updateBusinessRating(businessId: string) {
    // Obtenemos todas las calificaciones para ese negocio
    const ratings = await this.prisma.rating.findMany({
      where: { businessId },
    });

    if (ratings.length === 0) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { averageRating: null, ratingsCount: 0 },
      });
      return;
    }

    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    const average = sum / ratings.length;

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        averageRating: average,
        ratingsCount: ratings.length,
      },
    });
  }

  async getSummaryByBusinessId(businessId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { businessId },
      select: { value: true },
    });

    const ratingsCount = ratings.length;
    const averageRating =
      ratingsCount === 0
        ? null
        : ratings.reduce((sum, r) => sum + r.value, 0) / ratingsCount;

    return {
      averageRating: averageRating ? Number(averageRating.toFixed(1)) : 0,
      ratingsCount,
    };
  }

  async createOrUpdate(dto: CreateRatingDto, userId: string) {
    const { businessId, value, comment } = dto;

    await this.prisma.rating.upsert({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
      update: {
        value,
        comment,
        createdAt: new Date(),
      },
      create: {
        businessId,
        userId,
        value,
        comment,
      },
    });

    return { message: 'Rating saved successfully' };
  }

  async getCommentsByBusinessId(businessId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: {
        businessId,
        comment: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ratingsWithUser = await Promise.all(
      ratings.map(async (r) => {
        const userRes = await this.userService.findById(r.userId);
        const user = {
          id: userRes.id,
          fullName: `${userRes.firstName} ${userRes.lastName}`,
        };

        const rating = {
          id: r.id,
          comment: r.comment,
          value: r.value,
        };

        return {
          ...rating,
          user,
        };
      }),
    );

    return ratingsWithUser;
  }
}
