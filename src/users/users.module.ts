import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { TOKENS } from 'src/common/constants/tokens';

@Module({
  providers: [{ provide: TOKENS.IUserService, useClass: UsersService }],
  exports: [TOKENS.IUserService],
  controllers: [UsersController],
})
export class UsersModule {}
