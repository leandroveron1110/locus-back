import { Module } from '@nestjs/common';
import { FollowController } from './controllers/follow.controller';
import { FollowService } from './services/follow.service';
import { TOKENS } from 'src/common/constants/tokens';
import { SearchModule } from 'src/search/search.module';

@Module({
  controllers: [FollowController],
  imports: [
    SearchModule
  ],
  providers: [
    {
      provide: TOKENS.IFollowerService,
      useClass: FollowService,
    },
  ],
  exports: [TOKENS.IFollowerService],
})
export class FollowModule {}
