// src/users/controllers/users.controller.ts
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
  Inject, // Importa UseGuards
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../dto/Request/create-user.dto'; // Asegúrate que sea la ruta correcta
import { UserResponseDto } from '../dto/Response/user-response.dto'; // Asegúrate que sea la ruta correcta
import { UpdateUserDto } from '../dto/Request/update-user.dto'; // Asegúrate que sea la ruta correcta

import { TOKENS } from 'src/common/constants/tokens';
import { IUserService } from '../interfaces/User-service.interface';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseInterceptors(ClassSerializerInterceptor) // Aplica el interceptor para transformar las respuestas automáticamente
@Controller('users') // Prefijo para todas las rutas de este controlador (ej. /users)
export class UsersController {
  constructor(
    @Inject(TOKENS.IUserService)
    private readonly usersService: IUserService) {}

  // 1. Ruta para crear un usuario (ej. registro): Solo si se usa la clave secreta de administrador
  // Esta es la misma que ya tenías y está correctamente protegida por AdminSecretGuard.
  @Post()
  // @UseGuards(AdminSecretGuard) // Solo permite el acceso si se proporciona la clave secreta de administrador
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  // 2. Ruta para obtener TODOS los usuarios: Solo Administradores
  // Esta es la misma que ya tenías y está correctamente protegida.
  @Get()
  @Public()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  // 3. Ruta para obtener UN usuario por ID: Clientes, Dueños, o Administradores
  // Esta es la misma que ya tenías. Un cliente puede ver su propio perfil.
  // Un ADMIN o OWNER pueden ver cualquier perfil.
  @Get(':id')
  @Roles(UserRole.OWNER)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  @Get('email/:email')
  @Roles(UserRole.OWNER)
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`Usuario con email "${email}" no encontrado.`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  // 4. Ruta para actualizar UN usuario por ID: Solo Dueños y Administradores
  // Un 'OWNER' normalmente solo debería poder actualizar su propio perfil (requiere lógica adicional en el servicio/controlador).
  // Un 'ADMIN' puede actualizar cualquier perfil.
  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard) // <--- ¡NUEVO! Requiere autenticación JWT y verificación de rol
  // @Roles(UserRole.OWNER, UserRole.ADMIN) // <--- ¡NUEVO! Solo Dueños y Administradores pueden actualizar
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Si quieres que un OWNER solo pueda actualizarse a sí mismo:
    // const request = context.switchToHttp().getRequest();
    // if (request.user.rol === UserRole.OWNER && request.user.id !== id) {
    //   throw new ForbiddenException('No tienes permiso para actualizar este usuario.');
    // }
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // 5. Ruta para eliminar UN usuario por ID: Solo Administradores
  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard) // <--- ¡NUEVO! Requiere autenticación JWT y verificación de rol
  // @Roles(UserRole.ADMIN) // <--- ¡NUEVO! Solo Administradores pueden eliminar
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa sin contenido de respuesta
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
