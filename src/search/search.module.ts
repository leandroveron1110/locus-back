import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { TOKENS } from 'src/common/constants/tokens';
import { SearchableBusinessCrudService } from './services/searchable-business-crud.service';
import { SearchableBusinessController } from './controllers/searchable-business.controller';
import { SearchableBusinessTagController } from './controllers/searchable-business-tag.controller';
import { SearchableWeeklyScheduleCrudService } from './services/searchable-weekly-schedule-crud.service';
import { SearchableCategoryService } from './services/searchable-category-crud.service';
import { SearchableTagCrudService } from './services/searchable-tag-crud.service';
import { SearchableBusinessCategoryController } from './controllers/searchable-business-category.controller';
import { SearchableBusinessScheduleController } from './controllers/search-business-weekly-schedule.controller';

@Module({
  controllers: [
    SearchController,
    SearchableBusinessController,
    SearchableBusinessTagController,
    SearchableBusinessCategoryController,
    SearchableBusinessScheduleController
  ],
  providers: [
    {
      provide: TOKENS.ISearchService,
      useClass: SearchService,
    },
    {
      provide: TOKENS.ISearchableBusinessCrudService,
      useClass: SearchableBusinessCrudService,
    },
    {
      provide: TOKENS.ISearchableWeeklyScheduleCrudService,
      useClass: SearchableWeeklyScheduleCrudService,
    },
    {
      provide: TOKENS.ISearchCategoryCrudService,
      useClass: SearchableCategoryService,
    },
    {
      provide: TOKENS.ISearchableTagCrudService,
      useClass: SearchableTagCrudService,
    },
  ],
  exports: [
    TOKENS.ISearchService,
    TOKENS.ISearchableBusinessCrudService,
    TOKENS.ISearchCategoryCrudService,
    TOKENS.ISearchableWeeklyScheduleCrudService,
    TOKENS.ISearchableTagCrudService,
  ],
})
export class SearchModule {}
