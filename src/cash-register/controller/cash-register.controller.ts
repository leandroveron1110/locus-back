import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { OpenCashRegisterDto } from '../dtos/open-cash-register.dto';
import { CloseCashRegisterDto } from '../dtos/close-cash-register.dto';
import { FindCashRegisterHistoryDto } from '../dtos/find-cash-register-history.dto';
import { CashRegisterCommand } from '../services/command/cash-register-command.service';
import { CashRegisterQuery } from '../services/query/cash-register-query.service';
import { InitializeCashRegisterDto } from '../dtos/initialize-cash-register.dto';

@Controller('cash-registers')
export class CashRegisterController {
  constructor(
    private readonly command: CashRegisterCommand,
    private readonly query: CashRegisterQuery,
  ) {}

  @Post('initialize')
  async initialize(@Body() dto: InitializeCashRegisterDto) {
    return this.command.initialize(dto);
  }

  @Post('open')
  async open(@Body() dto: OpenCashRegisterDto) {
    // Mandamos el businessId y userId del JWT + los datos de apertura (openingAmount, clientTurnId, etc.)
    return await this.command.open(dto);
  }

  @Post('close')
  async close(@Body() dto: CloseCashRegisterDto) {
    // Cierre seguro inyectando el userId del sistema de auditoría
    return await this.command.close(dto.businessId, dto.userId, dto);
  }

  @Post('reopen/:turnId')
  async reopen(
    user: { businessId: string },
    @Param('turnId', ParseUUIDPipe) turnId: string,
  ) {
    // Opción administrativa para reabrir turnos específicos del negocio si hubo errores
    return await this.command.reopen(user.businessId, turnId);
  }

  @Get('current')
  async findCurrent(user: { businessId: string }) {
    // El cliente o el dashboard de business consulta su caja activa actual de forma transparente
    return await this.query.findCurrent(user.businessId);
  }

  @Get('history')
  async findHistory(
    user: { businessId: string },
    @Query() dto: FindCashRegisterHistoryDto,
  ) {
    // Historial paginado usando transacciones rápidas de Prisma
    return await this.query.findHistory(user.businessId, dto);
  }

  @Get('exists')
  async existsOpen(user: { businessId: string }) {
    // Endpoint ultraliviano para saber si hay caja abierta (sirve para validaciones rápidas)
    return await this.query.existsOpen(user.businessId);
  }

  @Get('summary')
  async calculateSummary(user: { businessId: string }) {
    // Devuelve el arqueo filtrado nativamente en PostgreSQL por métodos de pago
    return await this.query.calculateSummary(user.businessId);
  }

  @Get('closing-amount')
  async calculateClosingAmount(user: { businessId: string }) {
    // Devuelve el monto total calculado que el sistema espera encontrar al cerrar
    return await this.query.calculateClosingAmount(user.businessId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    // Para auditorías históricas buscando el detalle estático de un turno específico
    return await this.query.findById(id);
  }
}
