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
  UseGuards, // Importa UseGuards
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../dto/Request/create-user.dto'; // Asegúrate que sea la ruta correcta
import { UserResponseDto } from '../dto/Response/user-response.dto'; // Asegúrate que sea la ruta correcta
import { UpdateUserDto } from '../dto/Request/update-user.dto'; // Asegúrate que sea la ruta correcta

// Importa tus Guards y el Decorador de Roles desde el módulo Auth
import { AdminSecretGuard } from '../../auth/guards/admin-secret.guard'; // Ajusta la ruta si es necesario
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Ajusta la ruta si es necesario
import { RolesGuard } from '../../auth/guards/roles.guard'; // Ajusta la ruta si es necesario
import { Roles } from '../../auth/decorators/roles.decorator'; // Ajusta la ruta si es necesario
import { UserRole } from '@prisma/client'; // Importa tu enum de roles de Prisma

@UseInterceptors(ClassSerializerInterceptor) // Aplica el interceptor para transformar las respuestas automáticamente
@Controller('users') // Prefijo para todas las rutas de este controlador (ej. /users)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Ruta para crear un usuario (ej. registro): Solo si se usa la clave secreta de administrador
  // Esta es la misma que ya tenías y está correctamente protegida por AdminSecretGuard.
  @Post()
  @UseGuards(AdminSecretGuard) // Solo permite el acceso si se proporciona la clave secreta de administrador
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user);
  }

  // 2. Ruta para obtener TODOS los usuarios: Solo Administradores
  // Esta es la misma que ya tenías y está correctamente protegida.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y luego verifica el rol
  @Roles(UserRole.ADMIN) // Solo usuarios con el rol ADMIN pueden ver todos los usuarios
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  // 3. Ruta para obtener UN usuario por ID: Clientes, Dueños, o Administradores
  // Esta es la misma que ya tenías. Un cliente puede ver su propio perfil.
  // Un ADMIN o OWNER pueden ver cualquier perfil.
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Requiere autenticación JWT y luego verifica el rol
  @Roles(UserRole.CLIENT, UserRole.OWNER, UserRole.ADMIN) // Permite acceso a estos roles
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  // 4. Ruta para actualizar UN usuario por ID: Solo Dueños y Administradores
  // Un 'OWNER' normalmente solo debería poder actualizar su propio perfil (requiere lógica adicional en el servicio/controlador).
  // Un 'ADMIN' puede actualizar cualquier perfil.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // <--- ¡NUEVO! Requiere autenticación JWT y verificación de rol
  @Roles(UserRole.OWNER, UserRole.ADMIN) // <--- ¡NUEVO! Solo Dueños y Administradores pueden actualizar
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
  @UseGuards(JwtAuthGuard, RolesGuard) // <--- ¡NUEVO! Requiere autenticación JWT y verificación de rol
  @Roles(UserRole.ADMIN) // <--- ¡NUEVO! Solo Administradores pueden eliminar
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa sin contenido de respuesta
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
