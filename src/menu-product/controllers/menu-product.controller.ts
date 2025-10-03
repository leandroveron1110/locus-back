import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
  Inject,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { IMenuProductService } from '../interfaces/menu-product-service.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProductPermissions } from 'src/common/enums/rolees-permissions';
import { AccessStrategy } from 'src/auth/decorators/access-strategy.decorator';
import { AccessStrategyEnum } from 'src/auth/decorators/access-strategy.enum';

@Controller('menu-products')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class MenuProductController {
  constructor(
    @Inject(TOKENS.IMenuProductService)
    private readonly menuProductService: IMenuProductService,
  ) {}

  @Post()
  // Solo los dueños o aquellos con el permiso para gestionar productos pueden crear uno.
  @Roles(UserRole.OWNER)
  @Permissions(
    ProductPermissions.MANAGE_PRODUCTS,
    ProductPermissions.EDIT_PRODUCT,
  )
  @AccessStrategy(AccessStrategyEnum.ROLE_OR_ANY_PERMISSION)
  async create(@Body() dto: CreateMenuProductDto) {
    return await this.menuProductService.create(dto);
  }

  @Get()
  @Public() // Cualquiera puede ver el menú completo.
  findAll() {
    return this.menuProductService.findAll();
  }

  @Get('seccion/:seccionId')
  @Public() // Cualquiera puede ver los productos de una sección.
  findAllBySeccion(@Param('seccionId') seccionId: string) {
    return this.menuProductService.findAllBySeccion(seccionId);
  }

  @Get('product/:productId')
  @Public() // Cualquiera puede ver los detalles de un producto.
  findProducDetaillById(@Param('productId') productId: string) {
    return this.menuProductService.findProducDetaillById(productId);
  }

  // En su controlador (e.g., MenuProductController)

  // Nuevo endpoint para solicitar productos paginados por sección
  @Get('sections/:seccionId/products')
  @Public()
  async getProductsBySeccionPaginated(
    @Param('seccionId') seccionId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    // Conversión a números (asegúrese de manejar valores por defecto/errores)
    const parsedLimit = parseInt(limit, 10) || 10; // Valor por defecto: 10
    const parsedOffset = parseInt(offset, 10) || 0; // Valor por defecto: 0

    const products = await this.menuProductService.findPaginatedBySeccionId(
      seccionId,
      parsedLimit,
      parsedOffset,
    );

    return products
  }

  @Get(':id')
  @Public() // Cualquiera puede ver los detalles de un producto por ID.
  findOne(@Param('id') id: string) {
    return this.menuProductService.findOne(id);
  }

  @Patch(':id')
  // Solo los dueños o aquellos con el permiso para gestionar productos pueden actualizarlos.
  @Roles(UserRole.OWNER)
  @Permissions(ProductPermissions.MANAGE_PRODUCTS)
  update(@Param('id') id: string, @Body() dto: Partial<CreateMenuProductDto>) {
    return this.menuProductService.update(id, dto);
  }

  @Delete(':id')
  // Solo los dueños o aquellos con el permiso para gestionar productos pueden eliminarlos.
  @Roles(UserRole.OWNER)
  @Permissions(ProductPermissions.MANAGE_PRODUCTS)
  remove(@Param('id') id: string) {
    return this.menuProductService.remove(id);
  }
}
