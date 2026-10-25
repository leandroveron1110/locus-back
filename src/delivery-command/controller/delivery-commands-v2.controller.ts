// delivery-commands-v2.controller.ts
import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BusinessCommandStatusV2, LogisticsCommandStatusV2 } from '@prisma/client';
import { CreateDeliveryCommandDtoV2 } from '../dtos/request/create-delivery-command-v2.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { DeliveryCommandsV2Service } from '../services/command/delivery-queries-v2.service';
import { DeliveryQueriesV2Service } from '../services/query/delivery-queries-v2.service';

@Controller('delivery-commands-v2')
export class DeliveryCommandsV2Controller {
  constructor(
    private readonly commandsService: DeliveryCommandsV2Service,
    private readonly queriesService: DeliveryQueriesV2Service,
  ) {}

  // ==========================================================================
  // ESCRITURAS (COMMANDS)
  // ==========================================================================

  @Post()
  @Public()
  create(@Body() dto: CreateDeliveryCommandDtoV2) {
    return this.commandsService.create(dto);
  }

  @Delete()
  @Public()
  deleteAll() {
    return this.commandsService.deleteAll();
  }

  // ==========================================================================
  // ACCIONES DE BASE (OPERADOR LOGÍSTICO)
  // ==========================================================================

  @Patch(':id/base/quote')
  @Public()
  baseQuoteOrder(
    @Param('id') id: string,
    @Body('quotedCost') quotedCost: number,
  ) {
    return this.commandsService.baseQuoteOrder(id, quotedCost);
  }

  @Patch(':id/base/accept')
  @Public()
  baseAcceptDispatch(@Param('id') id: string) {
    return this.commandsService.baseAcceptDispatch(id);
  }

  @Patch(':id/base/in-transit')
  @Public()
  baseSetInTransit(@Param('id') id: string) {
    return this.commandsService.baseSetInTransit(id);
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id') id: string,
    @Body()
    body: {
      businessStatus?: BusinessCommandStatusV2;
      logisticsStatus?: LogisticsCommandStatusV2;
      quotedCost?: number;
      externalId?: string;
      failureReason?: string;
      requiredCouriers?: number;
      isShareable?: boolean;
    },
  ) {
    return this.commandsService.update(id, body);
  }

  @Patch('business/:businessId/order/:orderId')
  @Public()
  updateFinished(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.commandsService.updateFinished(businessId, orderId);
  }

  @Patch('cancel/business/:businessId/order/:orderId')
  @Public()
  cancelByBusiness(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.commandsService.cancelByBusiness(businessId, orderId);
  }

  // ==========================================================================
  // LECTURAS DE NEGOCIO (QUERIES)
  // ==========================================================================

  // Caja: Obtener las cotizaciones o precios actualizados del día
  @Get('business/:businessId/quotes')
  @Public()
  getBusinessQuotesResolved(@Param('businessId') businessId: string) {
    return this.queriesService.getBusinessQuotesResolved(businessId);
  }

  // Caja: Obtener los despachos completados hoy para el negocio
  @Get('business/:businessId/dispatches')
  @Public()
  getBusinessDispatchesAccepted(@Param('businessId') businessId: string) {
    return this.queriesService.getBusinessDispatchesAccepted(businessId);
  }

  // ==========================================================================
  // LECTURAS DE BASE (OPERADOR LOGÍSTICO)
  // ==========================================================================

  // Base: Cotizaciones urgentes que esperan precio del operador
  @Get('panel/base/urgent-quotes')
  @Public()
  getBaseUrgentQuotes(
    @Query() query: { zoneId?: string; limit?: string; page?: string },
  ) {
    return this.queriesService.getBaseUrgentQuotes({
      zoneId: query.zoneId,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      page: query.page ? parseInt(query.page, 10) : undefined,
    });
  }

  // Base: Despachos pendientes listos para mandar cadete
  @Get('panel/base/pending-dispatches')
  @Public()
  getBasePendingDispatches(
    @Query() query: { zoneId?: string; limit?: string; page?: string },
  ) {
    return this.queriesService.getBasePendingDispatches({
      zoneId: query.zoneId,
      limit: query.limit ? parseInt(query.limit, 100) : undefined,
      page: query.page ? parseInt(query.page, 100) : undefined,
    });
  }

  // Búsqueda general con filtros cruzados para la V2
  @Get()
  @Public()
  async findMany(
    @Query('businessStatus')
    businessStatus?: BusinessCommandStatusV2,

    @Query('logisticsStatus')
    logisticsStatus?: LogisticsCommandStatusV2,

    @Query('businessId')
    businessId?: string,

    @Query('orderId')
    orderId?: string,

    @Query('zoneId')
    zoneId?: string,

    @Query('from')
    from?: string,

    @Query('to')
    to?: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page?: number,

    @Query('limit', new DefaultValuePipe(50), ParseIntPipe)
    limit?: number,
  ) {
    return this.queriesService.findMany({
      businessStatus,
      logisticsStatus,
      businessId,
      orderId,
      zoneId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page,
      limit,
    });
  }
}