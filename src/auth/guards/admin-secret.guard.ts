// src/auth/guards/admin-secret.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config'; // Para acceder a variables de entorno

@Injectable()
export class AdminSecretGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminSecret = request.headers['x-admin-secret']; // Obtiene el encabezado

    const expectedSecret = this.configService.get<string>('ADMIN_SECRET_KEY'); // Obtiene la clave del .env

    if (!adminSecret || adminSecret !== expectedSecret) {
      throw new UnauthorizedException('Clave de administrador secreta inválida o no proporcionada.');
    }

    return true;
  }
}
