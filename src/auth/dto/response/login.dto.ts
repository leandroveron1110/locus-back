import { DeliveryEmployeeRole, User, UserRole } from '@prisma/client';

export class LoginResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  statusId?: string;
  avatarId?: string;

  businesses: {
    id: string;
    role: string | 'OWNER'; // Soporta dueño o cualquier rol dinámico
    permissions?: string[]; // Lista de permisos
  }[];

  deliveries?: {
    id: string;
    role: DeliveryEmployeeRole | 'OWNER';
    permissions?: string[];
  }[];

  static fromPrisma(user: User): LoginResponseDto {
    const dto = new LoginResponseDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.role = user.role;
    dto.statusId = user.statusId ?? undefined;
    dto.avatarId = user.avatarId ?? undefined;
    return dto;
  }
}
