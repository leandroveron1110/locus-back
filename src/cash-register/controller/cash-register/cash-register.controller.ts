import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreateCashRegisterDto } from 'src/cash-register/dtos/cash-register/create-cash-register.dto';
import { UpdateCashRegisterDto } from 'src/cash-register/dtos/cash-register/update-cash-register.dto';
import { CashRegisterService } from 'src/cash-register/services/cash-register/cash-register.service';

@Controller('cash-registers')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  @Post()
  @Public()
  create(@Body() input: CreateCashRegisterDto) {
    return this.cashRegisterService.create(input);
  }

  // --------------------------------------------------
  // FIND ALL BY BUSINESS
  // --------------------------------------------------

  @Get("business/:businessId")
  @Public()
  findAll(@Param('businessId')businessId: string) {
    return this.cashRegisterService.findAll(businessId);
  }

  // --------------------------------------------------
  // FIND BY ID TEMP
  // --------------------------------------------------

  @Get('id-temp/:idTemp')
  @Public()
  findByIdTemp(@Param('idTemp') idTemp: string) {
    return this.cashRegisterService.findByIdTemp(idTemp);
  }

  // --------------------------------------------------
  // FIND ONE
  // --------------------------------------------------

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.cashRegisterService.findOne(id);
  }

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() input: UpdateCashRegisterDto) {
    return this.cashRegisterService.update(id, input);
  }

  // --------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------

  @Patch(':id/toggle-active')
  @Public()
  toggleActive(@Param('id') id: string) {
    return this.cashRegisterService.toggleActive(id);
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.cashRegisterService.remove(id);
  }
}
