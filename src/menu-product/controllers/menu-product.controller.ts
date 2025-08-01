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
} from '@nestjs/common';
import { CreateMenuProductDto } from '../dtos/request/menu-producto-request.dto';
import { IMenuProductService } from '../interfaces/menu-product-service.interface';
import { Inject } from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';

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
  async create(@Body() dto: CreateMenuProductDto) {
    return await this.menuProductService.create(dto);
  }

  @Get()
  findAll() {
    return this.menuProductService.findAll();
  }

  @Get('seccion/:seccionId')
  findAllBySeccion(@Param('seccionId') seccionId: string) {
    return this.menuProductService.findAllBySeccion(seccionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuProductService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateMenuProductDto>) {
    return this.menuProductService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuProductService.remove(id);
  }
}
