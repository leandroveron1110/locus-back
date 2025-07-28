// src/modules/business/controllers/business.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';
import { BusinessResponseDto } from '../dto/Response/business-response.dto';
import { FindAllBusinessesDto } from '../dto/Request/find-all-businesses.dto'; // Importa el nuevo DTO
import { UpdateModulesConfigDto } from '../dto/Request/update-modules-config.dto'; // Importa el nuevo DTO

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client'; // Importa Prisma para los tipos de where/orderBy
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessService } from '../interfaces/business.interface';

@ApiTags('Businesses')
@Controller('businesses')
// Aplica ValidationPipe a nivel de controlador para validar todos los DTOs
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class BusinessController {
  constructor(
    @Inject(TOKENS.IBusinessService)
    private readonly businessService: IBusinessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  @ApiBody({ type: CreateBusinessDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The business has been successfully created.',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A business with the same name and address already exists.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid owner, category, or status ID provided.',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of businesses' })
  @ApiQuery({ type: FindAllBusinessesDto }) // Usa el DTO para las queries
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of businesses.',
    type: [BusinessResponseDto],
  })
  async findAll(@Query() queryParams: FindAllBusinessesDto): Promise<any[]> {
    // Transformar los strings JSON de `where` y `orderBy` a objetos de Prisma
    const where = queryParams.where
      ? (JSON.parse(queryParams.where) as Prisma.BusinessWhereInput)
      : undefined;
    const orderBy = queryParams.orderBy
      ? (JSON.parse(
          queryParams.orderBy,
        ) as Prisma.BusinessOrderByWithRelationInput)
      : undefined;

    return this.businessService.findAll({
      skip: queryParams.skip,
      take: queryParams.take,
      cursor: queryParams.cursor ? { id: queryParams.cursor } : undefined, // Asume que cursor es un ID único
      where,
      orderBy,
    });
  }

  @Get(':businessId')
  async findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string): Promise<any> {
    // Usamos ParseUUIDPipe para validar que el ID es un UUID válido
    return this.businessService.findOne(businessId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<any> {
    return this.businessService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.businessService.remove(id);
  }

  @Patch(':id/modules-config')
  async updateModulesConfig(
    @Param('id', ParseUUIDPipe) businessId: string,
    @Body() updateModulesConfigDto: UpdateModulesConfigDto,
  ): Promise<{ id: string; modulesConfig: Prisma.JsonValue }> {
    return this.businessService.updateModulesConfig(
      businessId,
      updateModulesConfigDto.modulesConfig,
    );
  }
}
