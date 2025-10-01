import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RatingService } from '../services/rating.service';
import { CreateRatingDto } from '../dtos/request/create-rating.dto';
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @Public()
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingService.rate(createRatingDto, createRatingDto.userId);
  }

  @Get('summary/:businessId')
  @Public()
  getSummary(@Param('businessId', UuidParam) businessId: string) {
    return this.ratingService.getSummaryByBusinessId(businessId);
  }

  @Get('comments/:businessId')
  @Public()
  async getComments(@Param('businessId') businessId: string) {
    return this.ratingService.getCommentsByBusinessId(businessId);
  }
}
