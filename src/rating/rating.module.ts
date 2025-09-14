import { Module } from '@nestjs/common';
import { RatingController } from './controllers/rating.controller';
import { RatingService } from './services/rating.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [RatingController],
  imports: [UsersModule],
  providers: [RatingService]
})
export class RatingModule {}
