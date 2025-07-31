import { Module } from '@nestjs/common';
import { MenuProductController } from './controllers/menu-product.controller';
import { MenuProductService } from './services/menu-product.service';
import { TOKENS } from 'src/common/constants/tokens';
import { MenuModule } from 'src/menu/menu.module';

@Module({
  controllers: [MenuProductController],
  providers: [
    {
      provide: TOKENS.IMenuProductService,
      useClass: MenuProductService,
    },
  ],
  exports: [TOKENS.IMenuProductService],
  imports: [
    MenuModule
  ]
})
export class MenuProductModule {}
