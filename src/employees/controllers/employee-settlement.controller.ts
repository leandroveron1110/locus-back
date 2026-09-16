import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  EmployeeSettlementStatus,
} from '@prisma/client';
import { EmployeeSettlementService } from '../services/employee-settlement.service';


@Controller('employee-settlements')
export class EmployeeSettlementController {
  constructor(
    private readonly settlementService: EmployeeSettlementService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      employeeId: string;

      periodStart: Date;
      periodEnd: Date;

      amount: number;

      status?: EmployeeSettlementStatus;
    },
  ) {
    return this.settlementService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.settlementService.findById(id);
  }

  @Get('employee/:employeeId')
  findByEmployeeId(
    @Param('employeeId') employeeId: string,
  ) {
    return this.settlementService.findByEmployeeId(
      employeeId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      periodStart?: Date;
      periodEnd?: Date;
      amount?: number;
      status?: EmployeeSettlementStatus;
      paidAt?: Date | null;
    },
  ) {
    return this.settlementService.update(
      id,
      body,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.settlementService.delete(id);
  }
}