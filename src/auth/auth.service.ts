// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // Para generar JWTs
import { UsersService } from '../users/services/users.service'; // Para validar usuarios
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client'; // El tipo User de Prisma
import * as bcrypt from 'bcryptjs'; // Para comparar contraseñas (asegúrate de tenerlo instalado)
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Inyecta el servicio de usuarios
    private jwtService: JwtService,     // Inyecta el servicio JWT
  ) {}

  /**
   * Valida las credenciales de un usuario.
   * @param email El email del usuario.
   * @param password La contraseña plana proporcionada.
   * @returns El objeto User si las credenciales son válidas, o null.
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      // Si las credenciales son correctas, retorna el usuario (sin el hash de contraseña)
      const { passwordHash, ...result } = user;
      return result as User;
    }
    return null;
  }

  /**
   * Procesa el inicio de sesión de un usuario y genera un token JWT.
   * @param loginDto DTO con email y contraseña.
   * @returns Un objeto con el token de acceso.
   * @throws UnauthorizedException Si las credenciales son inválidas.
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (email o contraseña incorrectos).');
    }

    // Define el payload del token JWT (debe coincidir con JwtPayload)
    const payload: JwtPayload = { sub: user.id, rol: user.role, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload), // Firma el token
    };
  }

  // Puedes añadir otros métodos relacionados con autenticación aquí (ej. refresh token, logout, etc.)
}