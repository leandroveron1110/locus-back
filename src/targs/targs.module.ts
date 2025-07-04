import { Module } from '@nestjs/common';
import { TagController } from './controllers/targs.controller';
import { TagService } from './services/targs.service';
import { TOKENS } from 'src/common/constants/tokens';
import { TagExistenceValidator } from './services/tag-existence.validator';

@Module({
  controllers: [TagController],
  providers: [
    {
      provide: TOKENS.ITagService,
      useClass: TagService,
    },
    {
      provide: TOKENS.ITagValidator,
      useClass: TagExistenceValidator
    }
  ],
  exports: [TOKENS.ITagService, TOKENS.ITagValidator],
})
export class TargsModule {}
