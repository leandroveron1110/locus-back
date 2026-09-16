import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EmployeeWorkSessionService } from '../services/employee-work-session.service';


@Controller('employee-work-sessions')
export class EmployeeWorkSessionController {
  constructor(
    private readonly workSessionService: EmployeeWorkSessionService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      employeeId: string;
      startedAt: Date;
      endedAt?: Date | null;
    },
  ) {
    return this.workSessionService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.workSessionService.findById(id);
  }

  @Get('employee/:employeeId')
  findByEmployeeId(
    @Param('employeeId') employeeId: string,
  ) {
    return this.workSessionService.findByEmployeeId(
      employeeId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      startedAt?: Date;
      endedAt?: Date | null;
    },
  ) {
    return this.workSessionService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workSessionService.delete(id);
  }
}