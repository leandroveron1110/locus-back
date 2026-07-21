import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateFinancialMovementDto } from '../dtos/create-financial-movement.dto';
import { RegisterSystemSaleDto } from '../dtos/register-system-sale.dto';
import { FinancialMovementCommand } from '../services/command/financial-movement-command.service';
import { FinancialMovementQuery } from '../services/query/financial-movement-query.service';

@Controller('financial-movements')
export class FinancialMovementController {
  constructor(
    private readonly command: FinancialMovementCommand,
    private readonly query: FinancialMovementQuery,
  ) {}

  /**
   * Registrar un ingreso o egreso manual.
   */
  @Post('manual')
  async createManual(
    @Body() dto: CreateFinancialMovementDto,
  ) {
    return this.command.createManualMovement(
      dto.businessId,
      dto.userId,
      dto,
    );
  }

  /**
   * Registrar una venta generada por el sistema.
   */
  @Post('system/sale')
  async registerSystemSale(
    @Body() dto: RegisterSystemSaleDto,
  ) {
    return this.command.registerSystemSale(
      dto.businessId,
      dto.userId,
      dto,
    );
  }

  /**
   * Obtener los movimientos del turno actual.
   */
  @Get('current-turn/:businessId')
  async findCurrentMovements(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.query.findCurrentTurnMovements(businessId);
  }

  /**
   * Obtener los movimientos de un turno específico.
   */
  @Get('turn/:turnId')
  async findByTurnId(
    @Param('turnId', ParseUUIDPipe) turnId: string,
  ) {
    return this.query.findByTurnId(turnId);
  }
}