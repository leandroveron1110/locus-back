import { Module } from '@nestjs/common';
import { EmployeesService } from './services/employees.service';
import { RolesService } from './services/roles.service';
import { BusinessEmployeeOverrideService } from './services/business-employee-override.service';
import { BusinessEmployeeService } from './services/business-employee.service';
import { BusinessRoleService } from './services/business-role.service';
import { EmployeeSettlementService } from './services/employee-settlement.service';
import { EmployeeWorkSessionService } from './services/employee-work-session.service';
import { PositionService } from './services/position.service';
import { BusinessEmployeeOverrideController } from './controllers/business-employee-override.controller';
import { BusinessEmployeeController } from './controllers/business-employee.controller';
import { BusinessRoleController } from './controllers/business-roles.controller';
import { EmployeeSettlementController } from './controllers/employee-settlement.controller';
import { EmployeeWorkSessionController } from './controllers/employee-work-session.controller';
import { PositionController } from './controllers/position.controller';

@Module({
  providers: [
    EmployeesService,
    RolesService,
    BusinessEmployeeOverrideService,
    BusinessEmployeeService,
    BusinessRoleService,
    EmployeeSettlementService,
    EmployeeWorkSessionService,
    PositionService,
  ],
  controllers: [
    BusinessEmployeeOverrideController,
    BusinessEmployeeController,
    BusinessRoleController,
    EmployeeSettlementController,
    EmployeeWorkSessionController,
    PositionController,
  ],
  exports: [EmployeesService], // para poder usarlo desde AuthService
})
export class EmployeesModule {}
