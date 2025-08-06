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
  CreateAddressDto,
  CreateAddressSchema,
  UpdateAddressDto,
  UpdateAddressSchema,
} from '../dtos/request/address.dto';
import { validateWithZod } from 'src/common/validators/validate-with-zod';

@Controller('address')
export class AddressesController {
  constructor(private readonly service: AddressService) {}

  @Post()
  create(@Body() body: any) {
    const validated = validateWithZod(CreateAddressSchema, body);
    return this.service.create(validated);
  }

  @Get('all')
  find() {
    return this.service.findAll();
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Get('business/:businessId')
  getByBusiness(@Param('businessId') businessId: string) {
    return this.service.findAllByBusiness(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const validated = validateWithZod(UpdateAddressSchema, body);
    return this.service.update(id, validated);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
