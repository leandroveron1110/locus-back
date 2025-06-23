import { Module } from '@nestjs/common';
import { BusinessController } from './controllers/business.controller';
import { BusinessService } from './services/business.service';
import { CategoriesModule } from 'src/categories/categories.module';
import { TargsModule } from 'src/targs/targs.module';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService],
  imports: [CategoriesModule, TargsModule],
})
export class BusinessModule {}
