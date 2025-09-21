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
import { CreateBusinessDto } from '../dto/Request/create-business.dto';
import { UpdateBusinessDto } from '../dto/Request/update-business.dto';
import { BusinessResponseDto } from '../dto/Response/business-response.dto';
import { FindAllBusinessesDto } from '../dto/Request/find-all-businesses.dto';
import { Prisma, UserRole } from '@prisma/client';
import { TOKENS } from 'src/common/constants/tokens';
import { IBusinessService } from '../interfaces/business.interface';
import { ModulesConfigSchema } from '../dto/Request/modules-config.schema.dto';
import { GetBusinessesDto } from '../dto/Request/business-ids.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { BusinessPermissions, EmployeePermissions, ProductPermissions } from 'src/common/enums/rolees-permissions';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';

@Controller('business')
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
  @Permissions(BusinessPermissions.CREATE_BUSINESS) // Asumimos un permiso para esto
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ALL_PERMISSIONS)
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessService.create(createBusinessDto);
  }

  // --- Rutas públicas para ver información de negocios ---
  // El guard RBAC no se ejecutará en estas rutas gracias a @Public()
  @Get()
  @Public()
  async findAll(@Query() queryParams: FindAllBusinessesDto): Promise<any[]> {
    const where = queryParams.where
      ? (JSON.parse(queryParams.where) as Prisma.BusinessWhereInput)
      : undefined;
    const orderBy = queryParams.orderBy
      ? (JSON.parse(queryParams.orderBy) as Prisma.BusinessOrderByWithRelationInput)
      : undefined;

    return this.businessService.findAll({
      skip: queryParams.skip,
      take: queryParams.take,
      cursor: queryParams.cursor ? { id: queryParams.cursor } : undefined,
      where,
      orderBy,
    });
  }

  @Get(':businessId')
  @Public()
  async findOne(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<any> {
    return this.businessService.findOne(businessId);
  }

  @Get('business/porfile/:businessId')
  @Public()
  async findForOrder(
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ): Promise<any> {
    return this.businessService.findForOrder(businessId);
  }
  
  
  @Patch(':id')
  @Roles(UserRole.OWNER)
  @Permissions(BusinessPermissions.EDIT_BUSINESS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ALL_PERMISSIONS)
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
  @Roles(UserRole.OWNER)
  async getModulesConfig(@Param('id', new ParseUUIDPipe()) businessId: string) {
    return this.businessService.getModulesConfigByBusinessId(businessId);
  }

  @Patch('modules-config/:id')
  async updateModulesConfig(
    @Param('id', new ParseUUIDPipe()) businessId: string,
    @Body() body: unknown,
  ) {
    const parsed = ModulesConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('modulesConfig inválido');
    }
    return this.businessService.updateModulesConfig(businessId, parsed.data);
  }

  @Post('businesses/ids/')
  @Roles(UserRole.OWNER)
  @Permissions(BusinessPermissions.VIEW_DASHBOARD, BusinessPermissions.EDIT_BUSINESS)
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async getBusinesses(@Body() body: GetBusinessesDto) {
    return await this.businessService.findManyByIds(body.ids);
  }
}