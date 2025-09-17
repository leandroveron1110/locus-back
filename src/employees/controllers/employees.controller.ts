import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import { CreateBusinessEmployeeDto, UpdateBusinessEmployeeDto } from '../dto/request/business-employee.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { EmployeePermissions } from 'src/common/enums/rolees-permissions';


@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // -------------------------------
  // Business Employees
  // -------------------------------

  @Post('business')
  @Roles(UserRole.OWNER)
  @Permissions(EmployeePermissions.CREATE_EMPLOYEE)
  async createBusinessEmployee(@Body() dto: CreateBusinessEmployeeDto) {
    return this.employeesService.createEmployee(dto);
  }

  @Patch('business/:id')
  @Permissions(EmployeePermissions.EDIT_EMPLOYEE)
  async updateBusinessEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, dto);
  }

  @Get('business/:businessId')
  @Public()
  async listBusinessEmployees(@Param('businessId') businessId: string) {
    return this.employeesService.listEmployees(businessId);
  }

  // -------------------------------
  // Delivery Employees
  // (Podemos mantenerlo igual por ahora, si no hemos refactorizado delivery)
  // -------------------------------

  // @Post('delivery')
  // async createDeliveryEmployee(@Body() dto: CreateDeliveryEmployeeDto) {
  //   return this.employeesService.createDeliveryEmployee(dto);
  // }

  // @Patch('delivery/:id')
  // async updateDeliveryEmployee(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateDeliveryEmployeeDto,
  // ) {
  //   return this.employeesService.updateDeliveryEmployee(id, dto);
  // }

  // @Get('delivery/:userId')
  // async listDeliveryEmployees(@Param('userId') userId: string) {
  //   return this.employeesService.findDeliveryEmployees(userId);
  // }
}
