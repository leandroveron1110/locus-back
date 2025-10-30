// src/search/search.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Logger,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { SearchBusinessDto } from '../dtos/request/search-business.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { ISearchService } from '../interfaces/search-service.interface';
import { Public } from 'src/auth/decorators/public.decorator';
import { GetBusinessesDto } from 'src/business/dto/Request/business-ids.dto';
import { LoggingService } from 'src/logging/logging.service';

@Controller('search')
export class SearchController {
  constructor(
    @Inject(TOKENS.ISearchService)
    private readonly searchService: ISearchService,
    private logger: LoggingService,
  ) {
    this.logger.setContext(SearchController.name);
    this.logger.setService('SearchModule');
  }

  @Get('businesses')
  @Public()
  async searchBusinesses(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    searchDto: SearchBusinessDto,
  ) {
    this.logger.log(`Received search request: ${JSON.stringify(searchDto)}`);
    return this.searchService.searchBusinesses(searchDto);
  }

  @Post('businesses/ids/')
  @Public()
  async getBusinesses(@Body() body: GetBusinessesDto) {
    this.logger.log(`Received search request: ${JSON.stringify(body.ids)}`);
    return this.searchService.searchBusinessesIds(body.ids);
  }

}
