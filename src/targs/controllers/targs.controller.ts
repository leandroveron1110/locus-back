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
  Inject,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

// DTOS
import { UpdateTagDto } from '../dto/Request/update-tag.dto';
import { TagResponseDto } from '../dto/Response/tag-response.dto';
import { CreateTagDto } from '../dto/Request/create-tag.dto';
import { TOKENS } from 'src/common/constants/tokens';
import { ITagService } from '../interfaces/tag-service.interface';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('tags') // Prefijo para todas las rutas: /tags
export class TagController {
  constructor(
    @Inject(TOKENS.ITagService)
    private readonly tagService: ITagService,
  ) {}

  // --- Rutas para ADMINISTRADORES (Crear, Actualizar, Desactivar Tags) ---

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  // @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagService.create(createTagDto);
    return plainToInstance(TagResponseDto, tag);
  }

  @Post('all')
  // @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  // @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createAll(
    @Body() createTagDto: CreateTagDto[],
  ): Promise<TagResponseDto[]> {
    const tag = await this.tagService.createAll(createTagDto);
    return plainToInstance(TagResponseDto, tag);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  // @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const updatedTag = await this.tagService.update(id, updateTagDto);
    return plainToInstance(TagResponseDto, updatedTag);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y rol ADMIN
  // @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content para eliminación/desactivación exitosa
  async remove(@Param('id') id: string): Promise<void> {
    await this.tagService.remove(id);
  }

  // --- Rutas de lectura (Consulta de Tags) ---
  // Estas rutas suelen ser públicas o accesibles por la mayoría de los roles.

  @Get()
  // Pública por defecto. Si se requiere autenticación, descomentar la siguiente línea:
  // @UseGuards(JwtAuthGuard)
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagService.findAll();
    return plainToInstance(TagResponseDto, tags);
  }

  @Get(':id')
  // Pública por defecto. Si se requiere autenticación, descomentar la siguiente línea:
  // @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<TagResponseDto> {
    const tag = await this.tagService.findOne(id);
    if (!tag) {
      throw new NotFoundException(`Tag con ID "${id}" no encontrado.`);
    }
    return plainToInstance(TagResponseDto, tag);
  }
}
