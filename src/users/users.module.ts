import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { TOKENS } from 'src/common/constants/tokens';
import { UserExistenceValidator } from './services/user-existence.validator';
import { BusinessModule } from 'src/business/business.module';
import { EmployeesModule } from 'src/employees/employees.module';

@Module({
  providers: [
    {
      provide: TOKENS.IUserService,
      useClass: UsersService,
    },
    {
      provide: TOKENS.IUserValidator,
      useClass: UserExistenceValidator,
    },
  ],
  exports: [TOKENS.IUserService, TOKENS.IUserValidator],
  controllers: [UsersController],
  imports: [forwardRef(() => BusinessModule), EmployeesModule],
})
export class UsersModule {}
