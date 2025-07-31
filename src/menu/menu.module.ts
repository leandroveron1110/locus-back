import { Module } from '@nestjs/common';
import { MenuController } from './controllers/menu.controller';
import { MenuService } from './services/menu.service';
import { TOKENS } from 'src/common/constants/tokens';
import { UsersModule } from 'src/users/users.module';
import { SeccionService } from './services/seccionService.service';
import { SeccionController } from './controllers/seccion.controller';
import { MenuValidatorService } from './services/validator/menu-validator.service';
import { SeccionValidatorService } from './services/validator/seccion-validator.service';

@Module({
  controllers: [MenuController, SeccionController],
  providers: [
    {
      provide: TOKENS.IMenuService,
      useClass: MenuService,
    },
    {
      provide: TOKENS.ISeccionService,
      useClass: SeccionService,
    },
    {
      provide: TOKENS.IMenuValidator,
      useClass: MenuValidatorService,
    },
    {
      provide: TOKENS.ISeccionValidator,
      useClass: SeccionValidatorService,
    },
  ],
  exports: [
    TOKENS.IMenuService,
    TOKENS.ISeccionService,
    TOKENS.IMenuValidator,
    TOKENS.ISeccionValidator,
  ],
  imports: [UsersModule],
})
export class MenuModule {}
