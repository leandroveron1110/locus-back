// src/auth/interfaces/jwt-payload.interface.ts
import { UserRole as Role, PermissionEnum } from '@prisma/client';

export interface JwtPayload {
  sub: string; // ID del usuario
  rol: Role;   // Rol global (ADMIN, USER, etc.)
  email: string;

  /**
   * Negocios en los que el usuario participa (como dueño o empleado).
   * role -> es el nombre dinámico del rol en la tabla BusinessRole.
   * permissions -> permisos efectivos, combinando role.permissions + overrides.
   */
  businesses: Array<{
    id: string;
    role: string | 'OWNER';
    permissions: PermissionEnum[];
  }>;

  /**
   * Si más adelante tienes deliveries con roles, puedes replicar esta estructura.
   */
  deliveries: Array<{
    id: string;
    role: string | 'OWNER';
    permissions: PermissionEnum[];
  }>;
}
