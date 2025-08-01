import { forwardRef, Module } from '@nestjs/common';
import { MenuProductController } from './controllers/menu-product.controller';
import { MenuProductService } from './services/menu-product.service';
import { TOKENS } from 'src/common/constants/tokens';
import { MenuModule } from 'src/menu/menu.module';
import { FoodCategoryService } from './services/food-category.service';
import { MenuProductImageService } from './services/menu-product-image.service';
import { OptionGroupService } from './services/option-group.service';
import { OptionService } from './services/option.service';
import { OptionGroupController } from './controllers/option-group.controller';
import { OptionController } from './controllers/option.controller';
import { MenuProductImageController } from './controllers/menu-product-image.controller';

@Module({
  controllers: [
    MenuProductController,
    OptionGroupController,
    OptionController,
    MenuProductImageController
  ],
  providers: [
    {
      provide: TOKENS.IMenuProductService,
      useClass: MenuProductService,
    },
    FoodCategoryService,
    MenuProductImageService,
    OptionGroupService,
    OptionService
  ],
  exports: [TOKENS.IMenuProductService],
  imports: [
    forwardRef(() =>MenuModule)
  ]
})
export class MenuProductModule {}
