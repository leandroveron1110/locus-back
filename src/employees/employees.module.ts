import { Module } from '@nestjs/common';
import { EmployeesService } from './services/employees.service';
import { EmployeesController } from './controllers/employees.controller';
import { RolesController } from './controllers/business-roles.controller';
import { RolesService } from './services/roles.service';

@Module({
  providers: [EmployeesService, RolesService],
  controllers: [EmployeesController, RolesController],
  exports: [EmployeesService], // para poder usarlo desde AuthService
})
export class EmployeesModule {}
