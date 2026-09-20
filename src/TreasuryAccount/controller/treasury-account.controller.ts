// treasury-account/treasury-account.controller.ts

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TreasuryAccountService } from '../services/treasury-account.service';
import { CreateTreasuryAccountDto } from '../dtos/create-treasury-account.dto';
import { UpdateTreasuryAccountDto } from '../dtos/update-treasury-account.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('treasury-accounts')
export class TreasuryAccountController {
  constructor(
    private readonly treasuryAccountService: TreasuryAccountService,
  ) {}

  @Post()
  @Public()
  async create(@Body() input: CreateTreasuryAccountDto) {
    return this.treasuryAccountService.create(input);
  }

  @Get('business/:businessId')
  @Public()
  async findByBusinessId(@Param('businessId') businessId: string) {
    return this.treasuryAccountService.findByBusinessId(businessId);
  }

  @Get('temp/:idTemp')
  @Public()
  async findByIdTemp(@Param('idTemp') idTemp: string) {
    return this.treasuryAccountService.findByIdTemp(idTemp);
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    return this.treasuryAccountService.findById(id);
  }

  @Patch()
  @Public()
  async update(@Body() input: UpdateTreasuryAccountDto) {
    return this.treasuryAccountService.update(input);
  }

  @Patch(':idTemp/toggle-active')
  @Public()
  async toggleActive(@Param('idTemp') idTemp: string) {
    return this.treasuryAccountService.toggleActive(idTemp);
  }
}
