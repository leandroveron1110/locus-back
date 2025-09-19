import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { IFollowService } from '../interfaces/follow-service.interface';
import { FollowCountResponseDto } from '../dtos/response/follow-count-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('follow')
export class FollowController {
  constructor(
    @Inject(TOKENS.IFollowerService)
    private readonly followService: IFollowService,
  ) {}

  @Post(':userId/:businessId')
  @Roles(UserRole.CLIENT)
  async followBusiness(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    const result = await this.followService.followBusiness(userId, businessId);
    return { message: 'Negocio seguido correctamente', data: result };
  }

  @Delete('unfollow/:userId/:businessId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowBusiness(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    await this.followService.unfollowBusiness(userId, businessId);
  }

  @Get('user/:userId')
  @Roles(UserRole.CLIENT)
  async getFollowedBusinesses(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.followService.getFollowedBusinesses(userId);
  }

  @Get('business/follow/:businessId')
  @Public()
  async getBusinessFollowers(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<FollowCountResponseDto> {
    let followData =
      await this.followService.getBusinessFollowerCount(businessId);

    return this.normalizeFollow(followData);
  }

  @Get('business/:businessId/:userId')
  @Roles(UserRole.CLIENT)
  async getBusinessUsersFollowers(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<FollowCountResponseDto> {
    let followData =
      await this.followService.getFollowingCountByBusinessAndIsFollowingUser(
        userId,
        businessId,
      );
    return this.normalizeFollow(followData);
  }

  @Get('isfollowing/:userId/:businessId')
  @Roles(UserRole.CLIENT)
  async isFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    const following = await this.followService.isFollowing(userId, businessId);
    return { isFollowing: following };
  }

  private normalizeFollow(
    follow: number | { isFollowing: boolean; count: number },
  ): { count: number; isFollowing: boolean } {
    return typeof follow === 'number'
      ? { count: follow, isFollowing: false }
      : follow;
  }
}
