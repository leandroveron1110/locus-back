import { PermissionEnum } from '@prisma/client';

export class EmployeeOverrideDto {
  permission: PermissionEnum;
  allowed: boolean;

  static fromPrisma(override: { permission: PermissionEnum; allowed: boolean }): EmployeeOverrideDto {
    const dto = new EmployeeOverrideDto();
    dto.permission = override.permission;
    dto.allowed = override.allowed;
    return dto;
  }

  static fromPrismaArray(overrides: { permission: PermissionEnum; allowed: boolean }[]): EmployeeOverrideDto[] {
    return overrides.map(EmployeeOverrideDto.fromPrisma);
  }
}

export class EmployeeRoleDto {
  id: string;
  name: string;
  permissions: PermissionEnum[];

  static fromPrisma(role: { id: string; name: string; permissions: PermissionEnum[] }): EmployeeRoleDto {
    const dto = new EmployeeRoleDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.permissions = role.permissions;
    return dto;
  }
}

export class EmployeeResponseDto {
  id: string;
  idUser: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarId: string | null;
  isDeleted: boolean;
  role: EmployeeRoleDto | null;
  overrides: EmployeeOverrideDto[];

  static fromPrisma(data: {
    id: string;
    idUser: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarId: string | null;
    isDeleted: boolean;
    role?: { id: string; name: string; permissions: PermissionEnum[] } | null;
    overrides?: { permission: PermissionEnum; allowed: boolean }[];
  }): EmployeeResponseDto {
    const dto = new EmployeeResponseDto();
    dto.id = data.id;
    dto.idUser = data.idUser;
    dto.firstName = data.firstName;
    dto.lastName = data.lastName;
    dto.email = data.email;
    dto.avatarId = data.avatarId;
    dto.isDeleted = data.isDeleted;
    dto.role = data.role ? EmployeeRoleDto.fromPrisma(data.role) : null;
    dto.overrides = data.overrides ? EmployeeOverrideDto.fromPrismaArray(data.overrides) : [];
    return dto;
  }

  static fromPrismaArray(dataArray: any[]): EmployeeResponseDto[] {
    return dataArray.map(EmployeeResponseDto.fromPrisma);
  }
}
