// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Decorador para asignar roles a rutas o controladores
// Ejemplo: @Roles(UserRole.ADMIN, UserRole.OWNER)
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);