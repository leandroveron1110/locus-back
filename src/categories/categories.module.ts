import { Module } from '@nestjs/common';
import { CategoryService } from './services/categories.service';
import { CategoryController } from './controllers/categories.controller';
import { TOKENS } from 'src/common/constants/tokens';
import { CategoryExistenceValidator } from './services/category-existence.validator';

@Module({
  providers: [
    {
      provide: TOKENS.ICategoryService,
      useClass: CategoryService,
    },
    {
      provide: TOKENS.ICategoryValidator,
      useClass: CategoryExistenceValidator
    }
  ],
  controllers: [CategoryController],
  exports: [TOKENS.ICategoryService, TOKENS.ICategoryValidator],
})
export class CategoriesModule {}
