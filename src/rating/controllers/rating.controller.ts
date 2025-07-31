import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RatingService } from '../services/rating.service';
import { CreateRatingDto } from '../dtos/request/create-rating.dto';
import { UuidParam } from 'src/common/pipes/uuid-param.pipe';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingService.create(createRatingDto);
  }

  @Get('summary/:businessId')
  getSummary(@Param('businessId', UuidParam) businessId: string) {
    return this.ratingService.getSummaryByBusinessId(businessId);
  }

  @Get('comments/:businessId')
async getComments(@Param('businessId') businessId: string) {
  return this.ratingService.getCommentsByBusinessId(businessId);
}

  
}
