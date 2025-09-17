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
} from '@nestjs/common';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { IMenuProductService } from '../interfaces/menu-product-service.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProductPermissions } from 'src/common/enums/rolees-permissions';

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
  @Permissions(ProductPermissions.MANAGE_PRODUCTS)
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