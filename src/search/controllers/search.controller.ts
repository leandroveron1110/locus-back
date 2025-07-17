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
import { CreateSearchableBusinessDto } from '../dtos/request/create-searchable-business.dto';
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

  // --- MÉTODO PARA CREAR/POBLAR SearchableBusiness para pruebas ---
  @Post('businesses')
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created si es exitoso
  async createSearchableBusiness(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createDto: CreateSearchableBusinessDto,
  ) {
    this.logger.log(
      `Received request to create/update searchable business: ${JSON.stringify(createDto.id)}`,
    );
    try {
      // Llama al nuevo método del SearchService para crear/actualizar la entrada
      const createdOrUpdatedEntry =
        await this.searchService.createSearchableBusinessEntry(createDto);
      this.logger.log(
        `Searchable business entry ${createDto.id} created/updated successfully.`,
      );
      return createdOrUpdatedEntry;
    } catch (error) {
      this.logger.error(
        `Error creating/updating searchable business entry ${createDto.id}:`,
        error.stack,
      );
      throw error; // Deja que NestJS maneje la excepción
    }
  }
}
