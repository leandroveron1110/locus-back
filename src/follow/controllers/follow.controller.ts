import { Controller, Post, Delete, Get, Param, HttpCode, HttpStatus, ParseUUIDPipe, Inject } from '@nestjs/common';
import { FollowService } from '../services/follow.service';
import { TOKENS } from 'src/common/constants/tokens';
import { IFollowService } from '../interfaces/follow-service.interface';

@Controller('follow')
export class FollowController {
  constructor(
    @Inject(TOKENS.IFollowerService)
    private readonly followService: IFollowService
  ) {}

  @Post(':userId/:businessId')
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
  async getFollowedBusinesses(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return await this.followService.getFollowedBusinesses(userId);
  }

  @Get('business/:businessId')
  async getBusinessFollowers(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return await this.followService.getBusinessFollowers(businessId);
  }

  @Get('isfollowing/:userId/:businessId')
  async isFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    const following = await this.followService.isFollowing(userId, businessId);
    return { isFollowing: following };
  }
}
