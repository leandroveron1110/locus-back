// src/search/search.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Logger,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { SearchBusinessDto } from '../dtos/request/search-business.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { ISearchService } from '../interfaces/search-service.interface';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    @Inject(TOKENS.ISearchService)
    private readonly searchService: ISearchService, // Solo inyecta SearchService
  ) {}

  @Get('businesses')
  async searchBusinesses(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    searchDto: SearchBusinessDto,
  ) {
    this.logger.log(`Received search request: ${JSON.stringify(searchDto)}`);
    return this.searchService.searchBusinesses(searchDto);
  }
}
