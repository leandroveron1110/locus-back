import { PermissionEnum, UserRole } from '@prisma/client';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsType } from 'src/common/enums/permissions-manager';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AccessStrategyEnum } from '../decorators/access-strategy.enum';
import {
  ACCESS_STRATEGY_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../../common/constants/rbac.constants';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private hasAnyPermission(
    userPermissions: PermissionEnum[],
    requiredPermissions: PermissionsType[],
  ): boolean {
    if (!requiredPermissions.length) return true;
    return requiredPermissions.some((p) =>
      userPermissions.includes(p as PermissionEnum),
    );
  }

  private hasAllPermissions(
    userPermissions: PermissionEnum[],
    requiredPermissions: PermissionsType[],
  ): boolean {
    if (!requiredPermissions.length) return true;
    return requiredPermissions.every((p) =>
      userPermissions.includes(p as PermissionEnum),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    // 🔑 Verifica si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Si es pública, permite el acceso de inmediato
    }

    // El resto de la lógica se mantiene
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionsType[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const accessStrategy =
      this.reflector.getAllAndOverride<AccessStrategyEnum>(
        ACCESS_STRATEGY_KEY,
        [context.getHandler(), context.getClass()],
      ) || AccessStrategyEnum.ROLE_OR_ANY_PERMISSION;

    if (!requiredRoles && !requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Superusuario -> bypass total
    if (user.rol === UserRole.ADMIN) return true;

    const hasRole = requiredRoles?.some((role) => user.rol === role) ?? false;
    const userPermissions =
      user.businesses?.flatMap((b) => b.permissions ?? []) ?? [];

    switch (accessStrategy) {
      case AccessStrategyEnum.ROLE_AND_ALL_PERMISSIONS:
        if (
          hasRole &&
          this.hasAllPermissions(userPermissions, requiredPermissions ?? [])
        )
          return true;
        break;
      case AccessStrategyEnum.ROLE_AND_ANY_PERMISSION:
        if (
          hasRole &&
          this.hasAnyPermission(userPermissions, requiredPermissions ?? [])
        )
          return true;
        break;
      case AccessStrategyEnum.ROLE_OR_ALL_PERMISSIONS:
        if (
          hasRole ||
          this.hasAllPermissions(userPermissions, requiredPermissions ?? [])
        )
          return true;
        break;
      case AccessStrategyEnum.ROLE_OR_ANY_PERMISSION:
        if (
          hasRole ||
          this.hasAnyPermission(userPermissions, requiredPermissions ?? [])
        )
          return true;
        break;
      case AccessStrategyEnum.ONLY_ROLE:
        if (hasRole) return true;
        break;
      case AccessStrategyEnum.ONLY_ALL_PERMISSIONS:
        if (this.hasAllPermissions(userPermissions, requiredPermissions ?? []))
          return true;
        break;
      case AccessStrategyEnum.ONLY_ANY_PERMISSION:
        if (this.hasAnyPermission(userPermissions, requiredPermissions ?? []))
          return true;
        break;
    }

    throw new ForbiddenException({
      message: 'Acceso denegado',
      strategy: accessStrategy,
      requiredRoles,
      requiredPermissions,
    });
  }
}
