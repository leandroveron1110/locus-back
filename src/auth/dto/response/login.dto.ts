import { User, UserRole } from '@prisma/client';

export class LoginResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string; // Dates usually come as ISO strings from the API
  updatedAt: string;
  statusId?: string;
  avatarId?: string;


  static fromPrisma(user: User): LoginResponseDto {
    const dto = new LoginResponseDto();
    dto.id = user.id;
    dto.firstName = dto.firstName
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.role = user.role;

    return dto;
  }
}
