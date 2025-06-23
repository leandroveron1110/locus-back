// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole as Role } from '@prisma/client'; // Importa tu enum de roles

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles requeridos desde los metadatos de la ruta/controlador
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles definidos para esta ruta, permite el acceso
    if (!requiredRoles) {
      return true;
    }

    // Obtiene el objeto 'user' que Passport.js adjuntó a la solicitud
    // Este objeto 'user' proviene del método validate() de tu JwtStrategy
    const { user } = context.switchToHttp().getRequest();

    // Si el usuario no está autenticado o no tiene un rol, deniega el acceso
    if (!user || !user.rol) {
      throw new ForbiddenException('Acceso denegado: Rol de usuario no definido o usuario no autenticado.');
    }

    // Verifica si el rol del usuario está incluido en los roles requeridos
    const hasRequiredRole = requiredRoles.includes(user.rol);

    if (!hasRequiredRole) {
      throw new ForbiddenException('Acceso denegado: No tienes el rol requerido para esta acción.');
    }

    return true;
  }
}