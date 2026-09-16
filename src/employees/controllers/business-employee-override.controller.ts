import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PermissionEnum } from '@prisma/client';
import { BusinessEmployeeOverrideService } from '../services/business-employee-override.service';

@Controller('business-employee-overrides')
export class BusinessEmployeeOverrideController {
  constructor(
    private readonly overrideService: BusinessEmployeeOverrideService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      employeeId: string;
      permission: PermissionEnum;
      allowed: boolean;
    },
  ) {
    return this.overrideService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.overrideService.findById(id);
  }

  @Get('employee/:employeeId')
  findByEmployeeId(
    @Param('employeeId') employeeId: string,
  ) {
    return this.overrideService.findByEmployeeId(
      employeeId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      permission?: PermissionEnum;
      allowed?: boolean;
    },
  ) {
    return this.overrideService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.overrideService.delete(id);
  }

  @Delete('employee/:employeeId')
  deleteByEmployeeId(
    @Param('employeeId') employeeId: string,
  ) {
    return this.overrideService.deleteByEmployeeId(
      employeeId,
    );
  }
}