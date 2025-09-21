import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ISeccionService } from '../interfaces/seccion-service.interface';
import {
  SeccionCreateDto,
  SeccionUpdateDto,
} from '../dtos/request/seccion.request.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProductPermissions } from 'src/common/enums/rolees-permissions';

@Controller('menu/secciones')
export class SeccionController {
  constructor(
    @Inject(TOKENS.ISeccionService)
    private readonly seccionService: ISeccionService,
  ) {}

  @Post()
  // Solo dueños o empleados con el rol de manager pueden crear secciones
  @Roles(UserRole.OWNER)
  @Permissions(ProductPermissions.MANAGE_PRODUCTS, ProductPermissions.EDIT_PRODUCT)
  async create(@Body() dto: SeccionCreateDto) {
    return this.seccionService.createSeccion(dto);
  }

  @Get()
  // Cualquiera (empleado, cliente, o no autenticado) puede ver las secciones del menú
  @Public()
  async findAllByMenu(@Query('menuId') menuId: string) {
    return this.seccionService.findAllByMenuId(menuId);
  }

  @Get(':id')
  // Cualquiera puede ver una sección específica
  @Public()
  async findOne(@Param('id') id: string) {
    return this.seccionService.findOne(id);
  }

  @Patch(':id')
  // Solo dueños o empleados con el permiso de gestionar productos pueden actualizar secciones
  @Roles(UserRole.OWNER)
  @Permissions(ProductPermissions.MANAGE_PRODUCTS)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<SeccionUpdateDto>,
  ) {
    return this.seccionService.updateSeccion(id, dto);
  }

  @Delete(':id')
  // Solo dueños o empleados con el permiso de gestionar productos pueden eliminar secciones
  @Roles(UserRole.OWNER)
  @Permissions(ProductPermissions.MANAGE_PRODUCTS)
  async delete(@Param('id') id: string) {
    return this.seccionService.deleteSeccion(id);
  }
}