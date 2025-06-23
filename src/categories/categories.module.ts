import { Module } from '@nestjs/common';
import { CategoryService } from './services/categories.service';
import { CategoryController } from './controllers/categories.controller';

@Module({
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [CategoryService]
})
export class CategoriesModule {}
