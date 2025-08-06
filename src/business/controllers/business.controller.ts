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
  BadRequestException,
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
import z from 'zod';
import { ModulesConfigSchema } from '../dto/Request/modules-config.schema.dto';

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
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<any> {
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

  @Get('modules-config/:id')
  async getModulesConfig(@Param('id', new ParseUUIDPipe()) businessId: string) {
    return this.businessService.getModulesConfigByBusinessId(businessId);
  }

  @Patch('modules-config/:id')
  async updateModulesConfig(
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() body: unknown,
  ) {
    // Validamos manualmente con Zod
    const parsed = ModulesConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('modulesConfig inválido');
    }

    return this.businessService.updateModulesConfig(businessId, parsed.data);
  }
}
