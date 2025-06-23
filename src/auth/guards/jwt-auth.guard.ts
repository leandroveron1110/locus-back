// src/auth/guards/jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Opcional: puedes personalizar el manejo de errores de autenticación
  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado: Token inválido o no proporcionado.');
    }
    return user;
  }
}