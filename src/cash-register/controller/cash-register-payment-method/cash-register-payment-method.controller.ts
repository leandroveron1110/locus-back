import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreateCashRegisterPaymentMethodDto } from 'src/cash-register/dtos/cash-register-payment-method/create-cash-register-payment-method.dto';
import { UpdateCashRegisterPaymentMethodDto } from 'src/cash-register/dtos/cash-register-payment-method/update-cash-register-payment-method.dto';
import { CashRegisterPaymentMethodService } from 'src/cash-register/services/cash-register-payment-method/cash-register-payment-method.service';

@Controller('cash-register-payment-methods')
export class CashRegisterPaymentMethodController {
  constructor(private readonly service: CashRegisterPaymentMethodService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateCashRegisterPaymentMethodDto) {
    return this.service.create(dto);
  }

  @Get('business/:businessId')
  @Public()
  findByBusinessId(@Param('businessId') businessId: string) {
    return this.service.findByBusinessId(businessId);
  }

  @Get('cash-register/:cashRegisterId')
  @Public()
  findByCashRegisterId(@Param('cashRegisterId') cashRegisterId: string) {
    return this.service.findByCashRegisterId(cashRegisterId);
  }

  @Get('id-temp/:idTemp')
  @Public()
  findByIdTemp(@Param('idTemp') idTemp: string) {
    return this.service.findByIdTemp(idTemp);
  }

  @Get(':id')
  @Public()
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCashRegisterPaymentMethodDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @Public()
  toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
