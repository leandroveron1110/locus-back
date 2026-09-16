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
import { BusinessRoleService } from '../services/business-role.service';

@Controller('business-roles')
export class BusinessRoleController {
  constructor(
    private readonly businessRoleService: BusinessRoleService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      businessId: string;
      name: string;
      permissions?: PermissionEnum[];
    },
  ) {
    return this.businessRoleService.create(
      body.businessId,
      body.name,
      body.permissions,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.businessRoleService.findById(id);
  }

  @Get('business/:businessId')
  findByBusinessId(
    @Param('businessId') businessId: string,
  ) {
    return this.businessRoleService.findByBusinessId(
      businessId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      permissions?: PermissionEnum[];
    },
  ) {
    return this.businessRoleService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.businessRoleService.delete(id);
  }
}