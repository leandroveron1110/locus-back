import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import {
  CreateBusinessEmployeeDto,
  CreateDeliveryEmployeeDto,
} from '../dto/request/create-employee.dto';
import {
  UpdateBusinessEmployeeDto,
  UpdateDeliveryEmployeeDto,
} from '../dto/request/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  // Business
  @Post('business')
  createBusinessEmployee(@Body() dto: CreateBusinessEmployeeDto) {
    return this.employeesService.createBusinessEmployee(dto);
  }

  @Patch('business/:id')
  updateBusinessEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessEmployeeDto,
  ) {
    return this.employeesService.updateBusinessEmployee(id, dto);
  }

  @Get('business/:userId')
  getBusinessEmployees(@Param('userId') userId: string) {
    return this.employeesService.findBusinessEmployees(userId);
  }

  // Delivery
  @Post('delivery')
  createDeliveryEmployee(@Body() dto: CreateDeliveryEmployeeDto) {
    return this.employeesService.createDeliveryEmployee(dto);
  }

  @Patch('delivery/:id')
  updateDeliveryEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryEmployeeDto,
  ) {
    return this.employeesService.updateDeliveryEmployee(id, dto);
  }

  @Get('delivery/:userId')
  getDeliveryEmployees(@Param('userId') userId: string) {
    return this.employeesService.findDeliveryEmployees(userId);
  }
}
