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
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('menus')
export class MenuController {
  constructor(
    @Inject(TOKENS.IMenuService)
    private readonly menuService: IMenuService,
  ) {}

  // Crear menú
  @Post()
  async create(@Body() dto: MenuCreateDto) {
    return await this.menuService.createMenu(dto);
  }

  // Obtener todos los menús de un negocio
  @Get('business/:businessId')
  @Public()
  async findAllByBusiness(@Param('businessId') businessId: string) {
    return await this.menuService.findAllByBusinessId(businessId);
  }

  @Get('business/all/:businessId')
  @Public()
  async findAllByBusinessIdForBusiness(@Param('businessId') businessId: string) {
    return await this.menuService.findAllByBusinessIdForBusiness(businessId);
  }

  @Get()
  async findAll() {
    return await this.menuService.findAll();
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
