// src/auth/interfaces/jwt-payload.interface.ts
import { UserRole as Role } from "@prisma/client"; // Importa tu enum de roles de Prisma

export interface JwtPayload {
  sub: string; // ID del usuario (sujeto del token)
  rol: Role;   // Rol del usuario (para autorización)
  email: string; // Puedes incluir más datos si los necesitas en el payload
}