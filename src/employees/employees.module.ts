import { Module } from '@nestjs/common';
import { EmployeesService } from './services/employees.service';
import { EmployeesController } from './controllers/employees.controller';

@Module({
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService], // para poder usarlo desde AuthService
})
export class EmployeesModule {}
