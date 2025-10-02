import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  UseGuards,
  Inject, // Importa UseGuards
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

// DTOs
import { CreateCategoryDto } from '../dto/Request/create-category.dto';
import { UpdateCategoryDto } from '../dto/Request/update-category.dto';
import { CategoryResponseDto } from '../dto/Response/category-response.dto';

import { TOKENS } from 'src/common/constants/tokens';
import { ICategoryService } from '../interfaces/Category.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@UseInterceptors(ClassSerializerInterceptor) // Transforma las respuestas automáticamente usando @Expose
@Controller('categories') // Prefijo para todas las rutas: /categories
export class CategoryController {
  constructor(
    @Inject(TOKENS.ICategoryService)
    private readonly categoryService: ICategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(createCategoryDto);
    return plainToInstance(CategoryResponseDto, category);
  }

  @Post('all')
  @HttpCode(HttpStatus.CREATED)
  async createAll(
    @Body() createCategoryDto: CreateCategoryDto[],
  ): Promise<CategoryResponseDto[]> {
    const category = await this.categoryService.createAll(createCategoryDto);
    return plainToInstance(CategoryResponseDto, category);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const updatedCategory = await this.categoryService.update(
      id,
      updateCategoryDto,
    );
    return plainToInstance(CategoryResponseDto, updatedCategory);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    // El servicio maneja la lógica de desactivación (soft delete)
    await this.categoryService.remove(id);
  }

  @Get()
  @Public()
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return plainToInstance(CategoryResponseDto, categories);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
    return plainToInstance(CategoryResponseDto, category);
  }
}
