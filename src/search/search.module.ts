import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { TOKENS } from 'src/common/constants/tokens';
import { SearchableBusinessCrudService } from './services/SearchableBusinessCrud.service';

@Module({
  controllers: [SearchController],
  providers: [{
    provide: TOKENS.ISearchService,
    useClass: SearchService
  },
  {
    provide: TOKENS.ISearchableBusinessCrudService,
    useClass: SearchableBusinessCrudService
  }
],
  exports: [TOKENS.ISearchService, TOKENS.ISearchableBusinessCrudService]
})
export class SearchModule {}
