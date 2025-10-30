import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddressService } from '../services/address.service';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
} from '../dtos/request/address.dto';
import { validateWithZod } from 'src/common/validators/validate-with-zod';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('address')
export class AddressesController {
  constructor(private readonly service: AddressService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  create(@Body() body: any) {
    const validated = validateWithZod(CreateAddressSchema, body);
    return this.service.create(validated);
  }

  @Get('all')
  find() {
    return this.service.findAll();
  }

  @Get('user/:userId')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  getByUser(@Param('userId') userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Get('business/:businessId')
  @Roles(UserRole.OWNER)
  getByBusiness(@Param('businessId') businessId: string) {
    return this.service.findAllByBusiness(businessId);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  update(@Param('id') id: string, @Body() body: any) {
    const validated = validateWithZod(UpdateAddressSchema, body);
    return this.service.update(id, validated);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT, UserRole.OWNER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
