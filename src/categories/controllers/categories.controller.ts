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
  UseGuards, // Importa UseGuards
} from '@nestjs/common';
import { CategoryService } from '../services/categories.service';
import { plainToInstance } from 'class-transformer';

// DTOs
import { CreateCategoryDto } from '../dto/Request/create-category.dto';
import { UpdateCategoryDto } from '../dto/Request/update-category.dto';
import { CategoryResponseDto } from '../dto/Response/category-response.dto';

// Importa tus Guards y el Decorador de Roles (asegúrate de que las rutas sean correctas)
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client'; // Importa tu enum de roles de Prisma

@UseInterceptors(ClassSerializerInterceptor) // Transforma las respuestas automáticamente usando @Expose
@Controller('categories') // Prefijo para todas las rutas: /categories
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // --- Rutas para ADMINISTRADORES (Crear, Actualizar, Desactivar Categorías) ---

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED) // Código 201 para creación exitosa
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(createCategoryDto);
    return plainToInstance(CategoryResponseDto, category);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT) // Código 204 para eliminación/desactivación exitosa (sin contenido de respuesta)
  async remove(@Param('id') id: string): Promise<void> {
    // El servicio maneja la lógica de desactivación (soft delete)
    await this.categoryService.remove(id);
  }

  // --- Rutas de lectura (Consulta de Categorías) ---
  // Estas rutas suelen ser públicas o accesibles por la mayoría de los roles
  // para permitir la navegación y filtrado de negocios.

  @Get()
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return plainToInstance(CategoryResponseDto, categories);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
    return plainToInstance(CategoryResponseDto, category);
  }
}
