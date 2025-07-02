import { Module } from '@nestjs/common';
import { CategoryService } from './services/categories.service';
import { CategoryController } from './controllers/categories.controller';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  providers: [
    {
      provide: TOKENS.ICategoryService,
      useClass: CategoryService,
    },
  ],
  controllers: [CategoryController],
  exports: [TOKENS.ICategoryService],
})
export class CategoriesModule {}
