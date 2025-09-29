import { Module } from '@nestjs/common';
import { RatingController } from './controllers/rating.controller';
import { RatingService } from './services/rating.service';
import { UsersModule } from 'src/users/users.module';
import { SearchModule } from 'src/search/search.module';

@Module({
  controllers: [RatingController],
  imports: [UsersModule, SearchModule],
  providers: [RatingService]
})
export class RatingModule {}
