// src/auth/interfaces/jwt-payload.interface.ts
import {
  BusinessEmployeeRole,
  DeliveryEmployeeRole,
  UserRole as Role,
} from '@prisma/client'; // Importa tu enum de roles de Prisma


export interface JwtPayload {
  sub: string;
  rol: Role;
  email: string;
  businesses?: {
    id: string;
    role: 'OWNER' | BusinessEmployeeRole;
    permissions?: string[];
  }[];
  deliveries?: {
    id: string;
    role: 'OWNER' | DeliveryEmployeeRole;
    permissions?: string[];
  }[];
}

