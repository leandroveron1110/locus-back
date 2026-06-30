// delivery-commands.controller.ts
import { Controller, Post, Body, Patch, Param, Get, Query, Delete } from '@nestjs/common';
import { DeliveryCommandStatus } from '@prisma/client';
import { DeliveryCommandsService } from '../services/command/delivery-command.service';
import { DeliveryQueriesService } from '../services/query/delivery-queries.service';
import { CreateDeliveryCommandDto } from '../dtos/request/create-delivery-command.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('delivery-commands')
export class DeliveryCommandsController {
  constructor(
    private readonly commandsService: DeliveryCommandsService,
    private readonly queriesService: DeliveryQueriesService,
  ) {}

  // ==========================================================================
  // ESCRITURAS (COMMANDS)
  // ==========================================================================

  @Post()
  @Public()
  create(@Body() dto: CreateDeliveryCommandDto) {
    return this.commandsService.create(dto);
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id') id: string, 
    @Body() body: { status: DeliveryCommandStatus; quotedCost?: number; externalId?: string; failureReason?: string }
  ) {
    return this.commandsService.update(id, body);
  }

  // ==========================================================================
  // LECTURAS (QUERIES)
  // ==========================================================================

  // Caja: Obtener las cotizaciones ya resueltas/preparadas del día
  @Get('business/:businessId/quotes')
  @Public()
  getBusinessQuotesResolved(@Param('businessId') businessId: string) {
    return this.queriesService.getBusinessQuotesResolved(businessId);
  }

  // Caja: Obtener los despachos que Base ya aceptó y tomó control hoy
  @Get('business/:businessId/dispatches')
  @Public()
  getBusinessDispatchesAccepted(@Param('businessId') businessId: string) {
    return this.queriesService.getBusinessDispatchesAccepted(businessId);
  }

  // ==========================================================================
  // LECTURAS DE BASE (OPERADOR)
  // ==========================================================================

  // Base: Pantalla/Pestaña de cotizaciones urgentes que esperan precio humano
  @Get('panel/base/urgent-quotes')
  @Public()
  getBaseUrgentQuotes(@Query() query: { zoneId?: string; limit?: string; page?: string }) {
    return this.queriesService.getBaseUrgentQuotes({
      zoneId: query.zoneId,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      page: query.page ? parseInt(query.page, 10) : undefined,
    });
  }

  // Base: Pantalla/Pestaña de despachos físicos pendientes (pedidos a mandar cadete)
  @Get('panel/base/pending-dispatches')
  @Public()
  getBasePendingDispatches(@Query() query: { zoneId?: string; limit?: string; page?: string }) {
    return this.queriesService.getBasePendingDispatches({
      zoneId: query.zoneId,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      page: query.page ? parseInt(query.page, 10) : undefined,
    });
  }
}