import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BusinessEmployeeService } from '../services/business-employee.service';


@Controller('business-employees')
export class BusinessEmployeeController {
  constructor(
    private readonly businessEmployeeService: BusinessEmployeeService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      businessId: string;
      userId?: string | null;

      firstName: string;
      lastName: string;
      phone?: string | null;

      positionId?: string | null;

      active?: boolean;

      paymentType: 'DAILY' | 'HOURLY' | 'MONTHLY';
      paymentRate: number;

      username?: string | null;
      passwordHash?: string | null;

      roleId?: string | null;
    },
  ) {
    return this.businessEmployeeService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.businessEmployeeService.findById(id);
  }

  @Get('business/:businessId')
  findByBusinessId(
    @Param('businessId') businessId: string,
  ) {
    return this.businessEmployeeService.findByBusinessId(
      businessId,
    );
  }

  @Get('business/:businessId/active')
  findActiveByBusinessId(
    @Param('businessId') businessId: string,
  ) {
    return this.businessEmployeeService.findActiveByBusinessId(
      businessId,
    );
  }

  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
  ) {
    return this.businessEmployeeService.findByUserId(
      userId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;

      positionId?: string | null;

      active?: boolean;

      paymentType?: 'DAILY' | 'HOURLY' | 'MONTHLY';
      paymentRate?: number;

      username?: string | null;
      passwordHash?: string | null;

      userId?: string | null;
      roleId?: string | null;
    },
  ) {
    return this.businessEmployeeService.update(
      id,
      body,
    );
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.businessEmployeeService.deactivate(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.businessEmployeeService.delete(id);
  }
}