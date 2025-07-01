// src/users/services/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Importa bcryptjs aquí
import { CreateUserDto } from '../dto/Request/create-user.dto';
import { UpdateUserDto } from '../dto/Request/update-user.dto';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario en la base de datos.
   * La contraseña se hashea dentro de este método.
   * @param data Los datos del nuevo usuario (la contraseña NO debe estar hasheada aquí).
   * @returns El objeto User creado (tal como lo retorna Prisma).
   */
  async create(data: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10); // Hasheo aquí

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword, // Guarda el hash
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.CLIENT,
      },
    });
  }

  /**
   * Obtiene todos los usuarios.
   * @returns Un array de objetos User.
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Busca un usuario por su ID único.
   * @param id El ID único del usuario.
   * @returns El objeto User si se encuentra, o null.
   */
  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if(!user) {
      throw new NotFoundException(`Usuario con el ID ${id} no encontrado`)
    }

    return user;
  }

  /**
   * Busca un usuario por su dirección de correo electrónico.
   * @param email La dirección de correo electrónico del usuario.
   * @returns El objeto User si se encuentra, o null.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Actualiza los datos de un usuario.
   * Maneja el hasheo de newPassword si se proporciona.
   * @param id El ID del usuario a actualizar.
   * @param data Los datos a actualizar.
   * @returns El objeto User actualizado.
   * @throws NotFoundException Si el usuario no es encontrado.
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const updateData: any = { ...data };

      // Si se proporciona newPassword, hashearla antes de actualizar
      if (updateData.newPassword) {
        updateData.passwordHash = await bcrypt.hash(updateData.newPassword, 10);
        delete updateData.newPassword; // Eliminar la propiedad original del DTO
      }
      // Asegúrate de que 'password' del DTO no sobreescriba 'passwordHash' si no es newPassword
      if (updateData.password) {
          delete updateData.password; // Si 'password' se usó para el oldPassword, lo removemos
      }


      return await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') { // Código de error de Prisma para "registro no encontrado"
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }
      throw error; // Propagar otros errores
    }
  }

  /**
   * Elimina un usuario por su ID.
   * @param id El ID del usuario a eliminar.
   * @returns El objeto User eliminado.
   * @throws NotFoundException Si el usuario no es encontrado.
   */
  async delete(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }
      throw error;
    }
  }

  /**
   * Compara una contraseña plana con un hash.
   * @param password Contraseña plana.
   * @param hash Hash almacenado.
   * @returns True si coinciden, false en caso contrario.
   */
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}