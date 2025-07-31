import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { MenuCreateDto, MenuUpdateDto } from '../dtos/request/menu.request.dto';
import { IMenuService } from '../interfaces/menu-service.interface';
import { TOKENS } from 'src/common/constants/tokens';

@Controller('menus')
export class MenuController {
  constructor(
    @Inject(TOKENS.IMenuService)
    private readonly menuService: IMenuService,
  ) {}

  // Crear menú
  @Post()
  async create(@Body() dto: MenuCreateDto) {
    return this.menuService.createMenu(dto);
  }

  // Obtener todos los menús de un negocio
  @Get()
  async findAllByBusiness(@Query('businessId') businessId: string) {
    return this.menuService.findAllByBusinessId(businessId);
  }

  // Obtener un menú por ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  // Actualizar un menú
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: MenuUpdateDto) {
    return this.menuService.updateMenu(id, dto);
  }

  // Eliminar un menú
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.menuService.deleteMenu(id);
  }
}
